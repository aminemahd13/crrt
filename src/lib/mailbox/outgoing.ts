import nodemailer from "nodemailer";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { recordInboxDraft, recordInboxSend } from "@/lib/metrics";
import { assertSmtpConfigured, resolveMailboxConfig } from "@/lib/mailbox/config";
import { createMailboxProvider } from "@/lib/mailbox/provider";
import type { DraftPayload, MailboxAddress, OutgoingAttachmentInput, SendMailInput } from "@/lib/mailbox/types";
import {
  asMailboxAddresses,
  assertMailboxPrismaDelegates,
  buildTransportOptions,
  ensureThread,
  generateRawMime,
  mapFolder,
  parseAndValidateAttachments,
  refreshThreadSummaries,
  toDbBytes,
  toParticipants,
  uniqueAddresses,
} from "@/lib/mailbox/core";
import {
  deriveThreadKey,
  generateMessageId,
  normalizeMessageId,
  normalizeReferences,
  normalizeSubject,
  sanitizeHtmlBody,
  stringifyAddresses,
  toSnippet,
  toTextFallback,
} from "@/lib/mailbox/utils";

async function appendToSentFolder(
  config: Awaited<ReturnType<typeof resolveMailboxConfig>>,
  rawMime: Buffer,
  sentAt: Date
): Promise<{ uid: number | null; uidValidity: bigint | null; error: string | null }> {
  let provider: ReturnType<typeof createMailboxProvider> | null = null;
  try {
    provider = createMailboxProvider(config);
    const appended = await provider.appendMessage({
      folderName: mapFolder(config, "sent"),
      content: rawMime,
      flags: ["\\Seen"],
      date: sentAt,
    });
    return { uid: appended.uid, uidValidity: appended.uidValidity, error: null };
  } catch (error) {
    return {
      uid: null,
      uidValidity: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (provider) await provider.close();
  }
}

async function mirrorDraftToImap(
  config: Awaited<ReturnType<typeof resolveMailboxConfig>>,
  input: {
    subject: string;
    htmlBody: string;
    textBody: string;
    to: MailboxAddress[];
    cc: MailboxAddress[];
    bcc: MailboxAddress[];
    attachments: Array<{ filename: string; mimeType: string; content: Buffer }>;
    priorRemoteUid: number | null;
  }
) {
  let provider: ReturnType<typeof createMailboxProvider> | null = null;
  try {
    provider = createMailboxProvider(config);

    if (input.priorRemoteUid) {
      try {
        await provider.moveMessage({
          sourceFolder: mapFolder(config, "drafts"),
          uid: input.priorRemoteUid,
          destinationFolder: mapFolder(config, "trash"),
        });
      } catch {
        // Best effort cleanup
      }
    }

    const draftMessageId = generateMessageId();
    const mailOptions: nodemailer.SendMailOptions = {
      from: config.smtp.from,
      replyTo: config.smtp.replyTo,
      to: stringifyAddresses(input.to),
      cc: stringifyAddresses(input.cc),
      bcc: stringifyAddresses(input.bcc),
      subject: input.subject || "(Draft)",
      html: input.htmlBody || "<p></p>",
      text: input.textBody || "",
      messageId: draftMessageId,
      attachments: input.attachments.map((attachment) => ({
        filename: attachment.filename,
        contentType: attachment.mimeType,
        content: attachment.content,
      })),
    };
    const rawMime = await generateRawMime(buildTransportOptions(config), mailOptions);
    const appended = await provider.appendMessage({
      folderName: mapFolder(config, "drafts"),
      content: rawMime,
      flags: ["\\Seen", "\\Draft"],
      date: new Date(),
    });
    return { uid: appended.uid, uidValidity: appended.uidValidity, error: null };
  } catch (error) {
    return {
      uid: null,
      uidValidity: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (provider) await provider.close();
  }
}

export async function sendMailboxMessage(
  input: SendMailInput,
  options: { actorEmail?: string | null; threadId?: string | null } = {}
) {
  assertMailboxPrismaDelegates();
  void options.actorEmail;
  const config = await resolveMailboxConfig();
  assertSmtpConfigured(config);

  const attachments = parseAndValidateAttachments(input.attachments);
  const generatedMessageId = generateMessageId();
  const normalizedInReplyTo = normalizeMessageId(input.threadHeaders?.inReplyTo ?? null);
  const normalizedReferences = normalizeReferences(input.threadHeaders?.references ?? []);
  const normalizedSubject = input.subject.trim();
  const htmlBody = sanitizeHtmlBody(input.htmlBody) ?? "";
  const textBody = input.textBody.trim() || toTextFallback(htmlBody);
  const sentAt = new Date();
  const threadKey = deriveThreadKey({
    references: normalizedReferences,
    inReplyTo: normalizedInReplyTo,
    messageId: normalizeMessageId(generatedMessageId),
    subject: normalizedSubject,
    date: sentAt,
    fromEmail: config.smtp.user.toLowerCase(),
  });

  const smtpTransport = nodemailer.createTransport(buildTransportOptions(config));
  const mailOptions: nodemailer.SendMailOptions = {
    from: config.smtp.from,
    replyTo: config.smtp.replyTo,
    to: stringifyAddresses(input.to),
    cc: stringifyAddresses(input.cc),
    bcc: stringifyAddresses(input.bcc),
    subject: normalizedSubject,
    html: htmlBody || `<pre>${textBody}</pre>`,
    text: textBody,
    messageId: generatedMessageId,
    attachments: attachments.map((attachment) => ({
      filename: attachment.filename,
      contentType: attachment.mimeType,
      content: attachment.content,
    })),
    ...(normalizedInReplyTo ? { inReplyTo: normalizedInReplyTo } : {}),
    ...(normalizedReferences.length > 0 ? { references: normalizedReferences } : {}),
  };
  const rawMime = await generateRawMime(buildTransportOptions(config), mailOptions);

  try {
    await smtpTransport.sendMail(mailOptions);
    const appendResult = await appendToSentFolder(config, rawMime, sentAt);

    const thread = options.threadId
      ? { id: options.threadId }
      : await ensureThread({
          mailbox: config.mailbox,
          threadKey,
          subject: normalizeSubject(normalizedSubject),
          participants: toParticipants(
            { name: "CRRT", address: config.smtp.user.toLowerCase() },
            input.to
          ),
          date: sentAt,
          snippet: toSnippet(textBody, htmlBody),
          hasAttachments: attachments.length > 0,
        });

    const created = await prisma.mailMessage.create({
      data: {
        mailbox: config.mailbox,
        threadId: thread.id,
        messageIdHeader: normalizeMessageId(generatedMessageId),
        inReplyTo: normalizedInReplyTo,
        references: normalizedReferences as unknown as Prisma.InputJsonValue,
        imapFolder: mapFolder(config, "sent"),
        imapUidValidity: appendResult.uidValidity,
        imapUid: appendResult.uid,
        fromName: "CRRT",
        fromEmail: config.smtp.user.toLowerCase(),
        toRecipients: input.to as unknown as Prisma.InputJsonValue,
        ccRecipients: input.cc as unknown as Prisma.InputJsonValue,
        bccRecipients: input.bcc as unknown as Prisma.InputJsonValue,
        subject: normalizedSubject,
        snippet: toSnippet(textBody, htmlBody),
        textBody,
        htmlBody,
        rawMime: toDbBytes(rawMime),
        rawMimeEncoding: "identity",
        date: sentAt,
        internalDate: sentAt,
        isRead: true,
        isFlagged: false,
        isDraft: false,
        isSent: true,
        direction: "outbound",
        appendPending: appendResult.uid === null,
        appendError: appendResult.error,
        attachments: {
          create: attachments.map((attachment) => ({
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            size: attachment.size,
            rawContent: toDbBytes(attachment.content),
            isInline: false,
          })),
        },
      },
      select: {
        id: true,
        threadId: true,
      },
    });

    await refreshThreadSummaries([created.threadId]);
    recordInboxSend("success");
    return {
      messageId: created.id,
      threadId: created.threadId,
      sentAt: sentAt.toISOString(),
      appendPending: appendResult.uid === null,
      appendError: appendResult.error,
    };
  } catch (error) {
    recordInboxSend("failure");
    throw error;
  } finally {
    smtpTransport.close();
  }
}

export async function replyToMailboxMessage(input: {
  messageId: string;
  mode: "reply" | "reply_all";
  htmlBody: string;
  textBody?: string;
  attachments: OutgoingAttachmentInput[];
  actorEmail?: string | null;
}) {
  assertMailboxPrismaDelegates();
  const source = await prisma.mailMessage.findUnique({
    where: { id: input.messageId },
    select: {
      threadId: true,
      messageIdHeader: true,
      references: true,
      subject: true,
      fromName: true,
      fromEmail: true,
      toRecipients: true,
      ccRecipients: true,
    },
  });
  if (!source || !source.fromEmail) {
    throw new Error("Reply target message not found.");
  }

  const config = await resolveMailboxConfig();
  const mailboxAddress = config.smtp.user.toLowerCase();
  const to: MailboxAddress[] = [{ name: source.fromName, address: source.fromEmail.toLowerCase() }];
  const cc: MailboxAddress[] = [];

  if (input.mode === "reply_all") {
    const merged = [...asMailboxAddresses(source.toRecipients), ...asMailboxAddresses(source.ccRecipients)];
    for (const address of merged) {
      if (address.address === mailboxAddress) continue;
      if (address.address === source.fromEmail.toLowerCase()) continue;
      cc.push(address);
    }
  }

  const references = normalizeReferences([
    ...(Array.isArray(source.references)
      ? source.references.filter((entry): entry is string => typeof entry === "string")
      : []),
    ...(source.messageIdHeader ? [source.messageIdHeader] : []),
  ]);
  const replySubject = source.subject.match(/^re\\s*:/i)
    ? source.subject
    : `Re: ${source.subject || "(No subject)"}`;

  return sendMailboxMessage(
    {
      to,
      cc: uniqueAddresses(cc),
      bcc: [],
      subject: replySubject,
      htmlBody: input.htmlBody,
      textBody: input.textBody?.trim() || toTextFallback(input.htmlBody),
      attachments: input.attachments,
      threadHeaders: {
        inReplyTo: source.messageIdHeader,
        references,
      },
    },
    {
      actorEmail: input.actorEmail,
      threadId: source.threadId,
    }
  );
}

function serializeDraft(draft: {
  id: string;
  threadId: string | null;
  toRecipients: unknown;
  ccRecipients: unknown;
  bccRecipients: unknown;
  subject: string;
  htmlBody: string;
  textBody: string;
  version: number;
  status: string;
  lastError: string | null;
  updatedAt: Date;
  createdAt: Date;
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    content?: Uint8Array<ArrayBuffer>;
  }>;
}) {
  return {
    id: draft.id,
    threadId: draft.threadId,
    to: asMailboxAddresses(draft.toRecipients),
    cc: asMailboxAddresses(draft.ccRecipients),
    bcc: asMailboxAddresses(draft.bccRecipients),
    subject: draft.subject,
    htmlBody: draft.htmlBody,
    textBody: draft.textBody,
    version: draft.version,
    status: draft.status,
    lastError: draft.lastError,
    updatedAt: draft.updatedAt.toISOString(),
    createdAt: draft.createdAt.toISOString(),
    attachments: draft.attachments.map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
      ...(attachment.content
        ? { contentBase64: Buffer.from(attachment.content).toString("base64") }
        : {}),
    })),
  };
}

export async function listMailboxDrafts(input: { page?: number; pageSize?: number; query?: string } = {}) {
  assertMailboxPrismaDelegates();
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, input.pageSize ?? 20));
  const query = input.query?.trim() ?? "";

  const where: Prisma.MailDraftWhereInput = query
    ? {
        OR: [
          { subject: { contains: query, mode: "insensitive" } },
          { htmlBody: { contains: query, mode: "insensitive" } },
          { textBody: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.mailDraft.count({ where }),
    prisma.mailDraft.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        attachments: {
          select: { id: true, filename: true, mimeType: true, size: true },
        },
      },
    }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      threadId: row.threadId,
      subject: row.subject || "(Draft)",
      updatedAt: row.updatedAt.toISOString(),
      to: asMailboxAddresses(row.toRecipients),
      attachmentCount: row.attachments.length,
      version: row.version,
      status: row.status,
    })),
    total,
    page,
    pageSize,
  };
}

export async function getMailboxDraft(id: string) {
  assertMailboxPrismaDelegates();
  const draft = await prisma.mailDraft.findUnique({
    where: { id },
    include: {
      attachments: {
        select: { id: true, filename: true, mimeType: true, size: true, content: true },
      },
    },
  });
  if (!draft) throw new Error("Draft not found.");
  return serializeDraft(draft);
}

export async function createMailboxDraft(payload: DraftPayload, actorEmail?: string | null) {
  assertMailboxPrismaDelegates();
  const attachments = parseAndValidateAttachments(payload.attachments);
  const created = await prisma.mailDraft.create({
    data: {
      mailbox: "shared",
      threadId: payload.threadId,
      toRecipients: payload.to as unknown as Prisma.InputJsonValue,
      ccRecipients: payload.cc as unknown as Prisma.InputJsonValue,
      bccRecipients: payload.bcc as unknown as Prisma.InputJsonValue,
      subject: payload.subject,
      htmlBody: payload.htmlBody,
      textBody: payload.textBody,
      createdByEmail: actorEmail ?? null,
      attachments: {
        create: attachments.map((attachment) => ({
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          content: toDbBytes(attachment.content)!,
        })),
      },
    },
    include: { attachments: true },
  });

  const config = await resolveMailboxConfig();
  const mirror = await mirrorDraftToImap(config, {
    subject: created.subject,
    htmlBody: created.htmlBody,
    textBody: created.textBody,
    to: asMailboxAddresses(created.toRecipients),
    cc: asMailboxAddresses(created.ccRecipients),
    bcc: asMailboxAddresses(created.bccRecipients),
    attachments: created.attachments.map((attachment) => ({
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      content: Buffer.from(attachment.content),
    })),
    priorRemoteUid: null,
  });

  const updated = await prisma.mailDraft.update({
    where: { id: created.id },
    data: {
      remoteUid: mirror.uid,
      remoteUidValidity: mirror.uidValidity,
      lastError: mirror.error,
    },
    include: {
      attachments: {
        select: { id: true, filename: true, mimeType: true, size: true },
      },
    },
  });

  recordInboxDraft("create", "success");
  return serializeDraft(updated);
}

export async function updateMailboxDraft(draftId: string, payload: DraftPayload, expectedVersion: number) {
  assertMailboxPrismaDelegates();
  const existing = await prisma.mailDraft.findUnique({
    where: { id: draftId },
    include: { attachments: true },
  });
  if (!existing) throw new Error("Draft not found.");
  if (existing.version !== expectedVersion) {
    throw new Error("Draft version conflict. Refresh and try again.");
  }

  const attachments = parseAndValidateAttachments(payload.attachments);
  const updated = await prisma.mailDraft.update({
    where: { id: draftId },
    data: {
      threadId: payload.threadId,
      toRecipients: payload.to as unknown as Prisma.InputJsonValue,
      ccRecipients: payload.cc as unknown as Prisma.InputJsonValue,
      bccRecipients: payload.bcc as unknown as Prisma.InputJsonValue,
      subject: payload.subject,
      htmlBody: payload.htmlBody,
      textBody: payload.textBody,
      version: { increment: 1 },
      attachments: {
        deleteMany: {},
        create: attachments.map((attachment) => ({
          filename: attachment.filename,
          mimeType: attachment.mimeType,
          size: attachment.size,
          content: toDbBytes(attachment.content)!,
        })),
      },
    },
    include: { attachments: true },
  });

  const config = await resolveMailboxConfig();
  const mirror = await mirrorDraftToImap(config, {
    subject: updated.subject,
    htmlBody: updated.htmlBody,
    textBody: updated.textBody,
    to: asMailboxAddresses(updated.toRecipients),
    cc: asMailboxAddresses(updated.ccRecipients),
    bcc: asMailboxAddresses(updated.bccRecipients),
    attachments: updated.attachments.map((attachment) => ({
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      content: Buffer.from(attachment.content),
    })),
    priorRemoteUid: existing.remoteUid,
  });

  const mirrored = await prisma.mailDraft.update({
    where: { id: draftId },
    data: {
      remoteUid: mirror.uid,
      remoteUidValidity: mirror.uidValidity,
      lastError: mirror.error,
    },
    include: {
      attachments: {
        select: { id: true, filename: true, mimeType: true, size: true },
      },
    },
  });

  recordInboxDraft("update", "success");
  return serializeDraft(mirrored);
}

export async function deleteMailboxDraft(draftId: string) {
  assertMailboxPrismaDelegates();
  const existing = await prisma.mailDraft.findUnique({
    where: { id: draftId },
    select: { id: true, remoteUid: true },
  });
  if (!existing) return;

  const config = await resolveMailboxConfig();
  if (existing.remoteUid) {
    let provider: ReturnType<typeof createMailboxProvider> | null = null;
    try {
      provider = createMailboxProvider(config);
      await provider.moveMessage({
        sourceFolder: mapFolder(config, "drafts"),
        uid: existing.remoteUid,
        destinationFolder: mapFolder(config, "trash"),
      });
    } catch (error) {
      logError("mailbox_draft_remote_delete_failed", {
        details: { draftId, error: error instanceof Error ? error.message : String(error) },
      });
    } finally {
      if (provider) {
        await provider.close();
      }
    }
  }

  await prisma.mailDraft.delete({ where: { id: draftId } });
  recordInboxDraft("delete", "success");
}

export async function sendMailboxDraft(draftId: string, actorEmail?: string | null) {
  assertMailboxPrismaDelegates();
  const draft = await prisma.mailDraft.findUnique({
    where: { id: draftId },
    include: { attachments: true },
  });
  if (!draft) throw new Error("Draft not found.");

  const threadHeaders = draft.threadId
    ? await prisma.mailMessage.findFirst({
        where: { threadId: draft.threadId },
        orderBy: { date: "desc" },
        select: {
          messageIdHeader: true,
          references: true,
        },
      }).then((message) => {
        if (!message?.messageIdHeader) return undefined;
        const references = normalizeReferences([
          ...(Array.isArray(message.references)
            ? message.references.filter((entry): entry is string => typeof entry === "string")
            : []),
          message.messageIdHeader,
        ]);
        return {
          inReplyTo: message.messageIdHeader,
          references,
        };
      })
    : undefined;

  const result = await sendMailboxMessage(
    {
      to: asMailboxAddresses(draft.toRecipients),
      cc: asMailboxAddresses(draft.ccRecipients),
      bcc: asMailboxAddresses(draft.bccRecipients),
      subject: draft.subject || "(No subject)",
      htmlBody: draft.htmlBody,
      textBody: draft.textBody,
      threadHeaders,
      attachments: draft.attachments.map((attachment) => ({
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        contentBase64: Buffer.from(attachment.content).toString("base64"),
      })),
    },
    {
      actorEmail,
      threadId: draft.threadId,
    }
  );

  await deleteMailboxDraft(draftId);
  recordInboxDraft("send", "success");
  return result;
}

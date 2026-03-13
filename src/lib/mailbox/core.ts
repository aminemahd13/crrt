import { gzipSync } from "zlib";
import type { Prisma } from "@prisma/client";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { prisma } from "@/lib/prisma";
import type { DraftPayload, MailboxAddress, MailboxFolderKey, OutgoingAttachmentInput, SendMailInput } from "@/lib/mailbox/types";
import {
  OUTGOING_ATTACHMENT_MAX_TOTAL_BYTES,
  sanitizeHtmlBody,
  toTextFallback,
  parseAttachmentInputs,
} from "@/lib/mailbox/utils";

export const SYNC_LOCK_KEY = BigInt(903202613);

export type DbAddress = {
  name: string | null;
  address: string;
};

export function asMailboxAddresses(value: unknown): MailboxAddress[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      const address = typeof candidate.address === "string" ? candidate.address.trim() : "";
      if (!address) return null;
      return {
        name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim() : null,
        address: address.toLowerCase(),
      };
    })
    .filter((entry): entry is MailboxAddress => Boolean(entry));
}

export function uniqueAddresses(addresses: MailboxAddress[]): MailboxAddress[] {
  const seen = new Set<string>();
  const unique: MailboxAddress[] = [];
  for (const address of addresses) {
    const key = address.address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(address);
  }
  return unique;
}

export function parseRecipientInput(input: unknown): MailboxAddress[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      const address = typeof candidate.address === "string" ? candidate.address.trim() : "";
      if (!address) return null;
      const name = typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim() : null;
      return { name, address: address.toLowerCase() };
    })
    .filter((entry): entry is MailboxAddress => Boolean(entry));
}

export function parseOutgoingAttachments(input: unknown): OutgoingAttachmentInput[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      if (
        typeof candidate.filename !== "string"
        || typeof candidate.mimeType !== "string"
        || typeof candidate.contentBase64 !== "string"
      ) {
        return null;
      }
      return {
        filename: candidate.filename,
        mimeType: candidate.mimeType,
        contentBase64: candidate.contentBase64,
      };
    })
    .filter((entry): entry is OutgoingAttachmentInput => Boolean(entry));
}

export function parseSendInput(body: unknown): SendMailInput {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload.");
  }
  const input = body as Record<string, unknown>;
  const to = parseRecipientInput(input.to);
  const cc = parseRecipientInput(input.cc);
  const bcc = parseRecipientInput(input.bcc);
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const htmlBodyRaw = typeof input.htmlBody === "string" ? input.htmlBody : "";
  const htmlBody = sanitizeHtmlBody(htmlBodyRaw) ?? "";
  const textBody =
    typeof input.textBody === "string" && input.textBody.trim().length > 0
      ? input.textBody.trim()
      : toTextFallback(htmlBody);
  const attachments = parseOutgoingAttachments(input.attachments);
  const inReplyTo = typeof input.inReplyTo === "string" ? input.inReplyTo.trim() : null;
  const references = Array.isArray(input.references)
    ? input.references.filter((entry): entry is string => typeof entry === "string")
    : [];

  if (to.length === 0) throw new Error("At least one recipient is required.");
  if (!subject) throw new Error("Subject is required.");
  if (!htmlBody && !textBody) throw new Error("Email body is required.");

  return {
    to,
    cc,
    bcc,
    subject,
    htmlBody: htmlBody || `<pre>${textBody}</pre>`,
    textBody,
    attachments,
    threadHeaders:
      inReplyTo || references.length > 0
        ? {
            inReplyTo,
            references,
          }
        : undefined,
  };
}

export function parseDraftPayload(body: unknown): DraftPayload {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid payload.");
  }
  const input = body as Record<string, unknown>;
  const to = parseRecipientInput(input.to);
  const cc = parseRecipientInput(input.cc);
  const bcc = parseRecipientInput(input.bcc);
  const subject = typeof input.subject === "string" ? input.subject : "";
  const htmlBodyRaw = typeof input.htmlBody === "string" ? input.htmlBody : "";
  const htmlBody = sanitizeHtmlBody(htmlBodyRaw) ?? "";
  const textBody =
    typeof input.textBody === "string" && input.textBody.trim().length > 0
      ? input.textBody.trim()
      : htmlBody
        ? toTextFallback(htmlBody)
        : "";
  const threadId = typeof input.threadId === "string" && input.threadId.trim()
    ? input.threadId.trim()
    : null;
  const attachments = parseOutgoingAttachments(input.attachments);

  return {
    to,
    cc,
    bcc,
    subject,
    htmlBody,
    textBody,
    threadId,
    attachments,
  };
}

export function mapFolder(config: { folders: Record<MailboxFolderKey, string> }, key: MailboxFolderKey): string {
  return config.folders[key];
}

export async function tryAcquireSyncLock(): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_lock(${SYNC_LOCK_KEY}) AS locked
  `;
  return rows[0]?.locked === true;
}

export async function releaseSyncLock(): Promise<void> {
  await prisma.$queryRaw`
    SELECT pg_advisory_unlock(${SYNC_LOCK_KEY})
  `;
}

export async function refreshThreadSummaries(threadIds: string[]): Promise<void> {
  const uniqueThreadIds = [...new Set(threadIds)];
  for (const threadId of uniqueThreadIds) {
    const latest = await prisma.mailMessage.findFirst({
      where: { threadId },
      orderBy: { date: "desc" },
      select: {
        date: true,
        snippet: true,
      },
    });
    const unreadCount = await prisma.mailMessage.count({
      where: {
        threadId,
        isRead: false,
      },
    });
    const attachmentCount = await prisma.mailAttachment.count({
      where: {
        message: { threadId },
      },
    });
    await prisma.mailThread.update({
      where: { id: threadId },
      data: {
        unreadCount,
        hasAttachments: attachmentCount > 0,
        lastMessageAt: latest?.date ?? null,
        snippet: latest?.snippet ?? null,
      },
    });
  }
}

export function toParticipants(from: MailboxAddress | null, to: MailboxAddress[]): DbAddress[] {
  const merged = uniqueAddresses([...(from ? [from] : []), ...to]);
  return merged.map((entry) => ({ name: entry.name, address: entry.address }));
}

export async function ensureThread(input: {
  mailbox: string;
  threadKey: string;
  subject: string;
  participants: DbAddress[];
  date: Date;
  snippet: string | null;
  hasAttachments: boolean;
}): Promise<{ id: string }> {
  return prisma.mailThread.upsert({
    where: {
      mailbox_threadKey: {
        mailbox: input.mailbox,
        threadKey: input.threadKey,
      },
    },
    update: {
      subject: input.subject || undefined,
      participants: input.participants as unknown as Prisma.InputJsonValue,
      lastMessageAt: input.date,
      snippet: input.snippet,
      hasAttachments: input.hasAttachments,
    },
    create: {
      mailbox: input.mailbox,
      threadKey: input.threadKey,
      subject: input.subject || undefined,
      participants: input.participants as unknown as Prisma.InputJsonValue,
      lastMessageAt: input.date,
      snippet: input.snippet,
      hasAttachments: input.hasAttachments,
    },
    select: {
      id: true,
    },
  });
}

export function buildTransportOptions(config: {
  smtp: { host: string; port: number; secure: boolean; user: string; pass: string };
}): SMTPTransport.Options {
  return {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    requireTLS: !config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  };
}

export async function generateRawMime(
  transportOptions: SMTPTransport.Options,
  mail: nodemailer.SendMailOptions
): Promise<Buffer> {
  const transport = nodemailer.createTransport({
    ...(transportOptions as Record<string, unknown>),
    streamTransport: true,
    newline: "unix",
    buffer: true,
  });
  const generated = await transport.sendMail(mail);
  if (Buffer.isBuffer(generated.message)) return generated.message;
  return Buffer.from(String(generated.message));
}

export function parseAndValidateAttachments(input: OutgoingAttachmentInput[]) {
  const attachments = parseAttachmentInputs(input);
  const total = attachments.reduce((sum, attachment) => sum + attachment.size, 0);
  if (total > OUTGOING_ATTACHMENT_MAX_TOTAL_BYTES) {
    throw new Error("Attachments exceed 25 MB total.");
  }
  return attachments;
}

export function gzipMime(rawMime: Buffer | null): Uint8Array<ArrayBuffer> | null {
  return rawMime ? toDbBytes(gzipSync(rawMime)) : null;
}

export function toDbBytes(
  raw: Buffer | Uint8Array | null | undefined
): Uint8Array<ArrayBuffer> | null {
  if (!raw) return null;
  const source = raw instanceof Uint8Array ? raw : Uint8Array.from(raw);
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return copy;
}

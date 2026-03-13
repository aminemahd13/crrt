import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { recordInboxMessageAction, recordInboxSync } from "@/lib/metrics";
import { assertImapConfigured, resolveMailboxConfig } from "@/lib/mailbox/config";
import { createMailboxProvider } from "@/lib/mailbox/provider";
import type { MailboxFolderKey } from "@/lib/mailbox/types";
import {
  ensureThread,
  gzipMime,
  mapFolder,
  refreshThreadSummaries,
  releaseSyncLock,
  toDbBytes,
  toParticipants,
  tryAcquireSyncLock,
} from "@/lib/mailbox/core";
import { normalizeSubject } from "@/lib/mailbox/utils";

export async function verifyImapConnection() {
  const config = await resolveMailboxConfig();
  assertImapConfigured(config);
  const provider = createMailboxProvider(config);
  try {
    return await provider.verify();
  } finally {
    await provider.close();
  }
}

export async function syncMailbox(options: { folderKey?: MailboxFolderKey } = {}) {
  const config = await resolveMailboxConfig();
  assertImapConfigured(config);

  const lockAcquired = await tryAcquireSyncLock();
  if (!lockAcquired) {
    return {
      ok: false,
      locked: true,
      imported: 0,
      updated: 0,
      details: [],
    };
  }

  const provider = createMailboxProvider(config);
  let imported = 0;
  let updated = 0;
  const details: Array<Record<string, unknown>> = [];

  try {
    const now = new Date();
    const sinceDate = new Date(now);
    sinceDate.setDate(sinceDate.getDate() - config.initialSyncDays);

    const folderEntries: Array<{ key: MailboxFolderKey; name: string }> = (
      options.folderKey
        ? [{ key: options.folderKey, name: mapFolder(config, options.folderKey) }]
        : (["inbox", "sent", "drafts", "archive", "trash"] as MailboxFolderKey[]).map((key) => ({
            key,
            name: mapFolder(config, key),
          }))
    );

    for (const folder of folderEntries) {
      const cursor = await prisma.mailFolderCursor.upsert({
        where: {
          mailbox_folderKey: {
            mailbox: config.mailbox,
            folderKey: folder.key,
          },
        },
        update: {
          folderName: folder.name,
          syncStatus: "running",
          lastError: null,
        },
        create: {
          mailbox: config.mailbox,
          folderKey: folder.key,
          folderName: folder.name,
          syncStatus: "running",
          lastError: null,
        },
      });

      const synced = await provider.syncFolder({
        folderName: folder.name,
        cursorUidValidity: cursor.uidValidity,
        cursorHighestUid: cursor.highestUid,
        sinceDate,
        mailboxAddress: config.imap.user,
      });

      if (synced.reset) {
        await prisma.mailMessage.deleteMany({
          where: {
            mailbox: config.mailbox,
            imapFolder: folder.name,
            imapUid: { not: null },
          },
        });
      }

      const touchedThreadIds = new Set<string>();

      for (const message of synced.messages) {
        const thread = await ensureThread({
          mailbox: config.mailbox,
          threadKey: message.threadKey,
          subject: normalizeSubject(message.subject),
          participants: toParticipants(message.from, message.to),
          date: message.date,
          snippet: message.snippet,
          hasAttachments: message.attachments.length > 0,
        });
        touchedThreadIds.add(thread.id);

        const existing = await prisma.mailMessage.findUnique({
          where: {
            imapFolder_imapUidValidity_imapUid: {
              imapFolder: message.folderName,
              imapUidValidity: message.uidValidity,
              imapUid: message.uid,
            },
          },
          select: { id: true },
        });

        const commonData: Prisma.MailMessageUncheckedCreateInput = {
          mailbox: config.mailbox,
          threadId: thread.id,
          messageIdHeader: message.messageIdHeader,
          inReplyTo: message.inReplyTo,
          references: message.references as unknown as Prisma.InputJsonValue,
          imapFolder: message.folderName,
          imapUidValidity: message.uidValidity,
          imapUid: message.uid,
          fromName: message.from?.name ?? null,
          fromEmail: message.from?.address ?? null,
          toRecipients: message.to as unknown as Prisma.InputJsonValue,
          ccRecipients: message.cc as unknown as Prisma.InputJsonValue,
          bccRecipients: message.bcc as unknown as Prisma.InputJsonValue,
          subject: message.subject,
          snippet: message.snippet,
          textBody: message.textBody,
          htmlBody: message.htmlBody,
          rawMime: gzipMime(message.rawMime),
          rawMimeEncoding: message.rawMime ? "gzip" : message.rawMimeEncoding,
          date: message.date,
          internalDate: message.internalDate,
          isRead: message.isRead,
          isFlagged: message.isFlagged,
          isDraft: folder.key === "drafts",
          isSent: folder.key === "sent",
          direction: message.direction,
        };

        if (existing) {
          await prisma.mailMessage.update({
            where: { id: existing.id },
            data: {
              threadId: commonData.threadId,
              messageIdHeader: commonData.messageIdHeader,
              inReplyTo: commonData.inReplyTo,
              references: commonData.references,
              fromName: commonData.fromName,
              fromEmail: commonData.fromEmail,
              toRecipients: commonData.toRecipients,
              ccRecipients: commonData.ccRecipients,
              bccRecipients: commonData.bccRecipients,
              subject: commonData.subject,
              snippet: commonData.snippet,
              textBody: commonData.textBody,
              htmlBody: commonData.htmlBody,
              rawMime: commonData.rawMime,
              rawMimeEncoding: commonData.rawMimeEncoding,
              date: commonData.date,
              internalDate: commonData.internalDate,
              isRead: commonData.isRead,
              isFlagged: commonData.isFlagged,
              isDraft: commonData.isDraft,
              isSent: commonData.isSent,
              direction: commonData.direction,
            },
          });
          updated += 1;
        } else {
          await prisma.mailMessage.create({
            data: {
              ...commonData,
              attachments: {
                create: message.attachments.map((attachment) => ({
                  filename: attachment.filename,
                  mimeType: attachment.mimeType,
                  size: attachment.size,
                  contentId: attachment.contentId,
                  isInline: attachment.isInline,
                  rawContent: toDbBytes(attachment.rawContent),
                  transferEncoding: attachment.transferEncoding,
                })),
              },
            },
          });
          imported += 1;
        }
      }

      for (const flagUpdate of synced.flagUpdates) {
        await prisma.mailMessage.updateMany({
          where: {
            mailbox: config.mailbox,
            imapFolder: folder.name,
            imapUidValidity: synced.uidValidity,
            imapUid: flagUpdate.uid,
          },
          data: {
            isRead: flagUpdate.isRead,
            isFlagged: flagUpdate.isFlagged,
            internalDate: flagUpdate.internalDate,
          },
        });
      }

      await prisma.mailFolderCursor.update({
        where: {
          mailbox_folderKey: {
            mailbox: config.mailbox,
            folderKey: folder.key,
          },
        },
        data: {
          folderName: folder.name,
          uidValidity: synced.uidValidity,
          highestUid: synced.highestUid,
          lastSyncedAt: new Date(),
          syncStatus: "success",
          lastError: null,
        },
      });

      await refreshThreadSummaries([...touchedThreadIds]);
      details.push({
        folderKey: folder.key,
        folderName: folder.name,
        imported: synced.messages.length,
        highestUid: synced.highestUid,
        reset: synced.reset,
      });
    }

    recordInboxSync("success");
    return { ok: true, locked: false, imported, updated, details };
  } catch (error) {
    recordInboxSync("failure");
    const message = error instanceof Error ? error.message : String(error);
    logError("mailbox_sync_failed", {
      pathname: "/api/admin/inbox/sync",
      method: "POST",
      status: 500,
      details: { error: message },
    });
    return { ok: false, locked: false, imported, updated, details, error: message };
  } finally {
    await provider.close();
    await releaseSyncLock();
  }
}

export async function listInboxThreads(input: {
  folderKey: Exclude<MailboxFolderKey, "drafts">;
  query?: string;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const config = await resolveMailboxConfig();
  const folderName = mapFolder(config, input.folderKey);
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));
  const q = input.query?.trim() ?? "";

  const where: Prisma.MailMessageWhereInput = {
    mailbox: config.mailbox,
    imapFolder: folderName,
    isDraft: false,
    ...(input.unreadOnly ? { isRead: false } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" } },
            { snippet: { contains: q, mode: "insensitive" } },
            { fromEmail: { contains: q, mode: "insensitive" } },
            { fromName: { contains: q, mode: "insensitive" } },
            { textBody: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [grouped, rows, unreadGrouped] = await Promise.all([
    prisma.mailMessage.groupBy({ by: ["threadId"], where }),
    prisma.mailMessage.findMany({
      where,
      orderBy: { date: "desc" },
      distinct: ["threadId"],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        thread: {
          select: {
            subject: true,
            hasAttachments: true,
          },
        },
      },
    }),
    prisma.mailMessage.groupBy({
      by: ["threadId"],
      where: { ...where, isRead: false },
      _count: { _all: true },
    }),
  ]);

  const unreadMap = new Map(unreadGrouped.map((entry) => [entry.threadId, entry._count._all]));

  return {
    items: rows.map((row) => ({
      threadId: row.threadId,
      latestMessageId: row.id,
      subject: row.subject || row.thread.subject || "(No subject)",
      snippet: row.snippet,
      from: { name: row.fromName, email: row.fromEmail },
      date: row.date.toISOString(),
      unreadCount: unreadMap.get(row.threadId) ?? 0,
      hasAttachments: row.thread.hasAttachments,
      folderKey: input.folderKey,
    })),
    total: grouped.length,
    page,
    pageSize,
  };
}

export async function getThreadMessages(threadId: string) {
  const rows = await prisma.mailMessage.findMany({
    where: { threadId },
    orderBy: { date: "asc" },
    include: {
      attachments: {
        select: { id: true, filename: true, mimeType: true, size: true, isInline: true },
      },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    threadId: row.threadId,
    messageIdHeader: row.messageIdHeader,
    inReplyTo: row.inReplyTo,
    references: row.references,
    folder: row.imapFolder,
    from: { name: row.fromName, email: row.fromEmail },
    to: row.toRecipients,
    cc: row.ccRecipients,
    bcc: row.bccRecipients,
    subject: row.subject,
    snippet: row.snippet,
    textBody: row.textBody,
    htmlBody: row.htmlBody,
    date: row.date.toISOString(),
    isRead: row.isRead,
    isFlagged: row.isFlagged,
    direction: row.direction,
    attachments: row.attachments,
  }));
}

export async function setMessageReadState(messageId: string, seen: boolean) {
  const config = await resolveMailboxConfig();
  const existing = await prisma.mailMessage.findUnique({
    where: { id: messageId },
    select: { id: true, threadId: true, imapFolder: true, imapUid: true },
  });
  if (!existing) throw new Error("Message not found.");

  let provider: ReturnType<typeof createMailboxProvider> | null = null;
  try {
    if (existing.imapUid !== null) {
      assertImapConfigured(config);
      provider = createMailboxProvider(config);
      await provider.setSeen({ folderName: existing.imapFolder, uid: existing.imapUid, seen });
    }
    await prisma.mailMessage.update({ where: { id: existing.id }, data: { isRead: seen } });
    await refreshThreadSummaries([existing.threadId]);
    recordInboxMessageAction("mark_read", "success");
  } catch (error) {
    recordInboxMessageAction("mark_read", "failure");
    throw error;
  } finally {
    if (provider) await provider.close();
  }
}

export async function moveMessageToFolder(messageId: string, targetFolderKey: "inbox" | "archive" | "trash") {
  const config = await resolveMailboxConfig();
  const existing = await prisma.mailMessage.findUnique({
    where: { id: messageId },
    select: { id: true, threadId: true, imapFolder: true, imapUid: true },
  });
  if (!existing) throw new Error("Message not found.");

  const destinationFolder = mapFolder(config, targetFolderKey);
  let provider: ReturnType<typeof createMailboxProvider> | null = null;
  try {
    if (existing.imapUid !== null) {
      assertImapConfigured(config);
      provider = createMailboxProvider(config);
      await provider.moveMessage({
        sourceFolder: existing.imapFolder,
        uid: existing.imapUid,
        destinationFolder,
      });
    }
    await prisma.mailMessage.update({
      where: { id: existing.id },
      data: {
        imapFolder: destinationFolder,
        // IMAP MOVE usually assigns a new UID in destination mailbox.
        imapUid: null,
        imapUidValidity: null,
      },
    });
    await refreshThreadSummaries([existing.threadId]);
    recordInboxMessageAction("move", "success");
  } catch (error) {
    recordInboxMessageAction("move", "failure");
    throw error;
  } finally {
    if (provider) await provider.close();
  }
}

export async function getMailboxAttachmentContent(attachmentId: string) {
  const attachment = await prisma.mailAttachment.findUnique({
    where: { id: attachmentId },
    select: { id: true, filename: true, mimeType: true, size: true, rawContent: true },
  });
  if (!attachment || !attachment.rawContent) throw new Error("Attachment not found.");
  return {
    id: attachment.id,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size,
    content: Buffer.from(attachment.rawContent),
  };
}

export async function getMailboxStatus() {
  const config = await resolveMailboxConfig();
  const cursors = await prisma.mailFolderCursor.findMany({
    where: { mailbox: config.mailbox },
    orderBy: { folderKey: "asc" },
  });
  return {
    mailbox: config.mailbox,
    syncIntervalSeconds: config.syncIntervalSeconds,
    initialSyncDays: config.initialSyncDays,
    folders: config.folders,
    cursors: cursors.map((cursor) => ({
      folderKey: cursor.folderKey,
      folderName: cursor.folderName,
      highestUid: cursor.highestUid,
      uidValidity: cursor.uidValidity ? cursor.uidValidity.toString() : null,
      syncStatus: cursor.syncStatus,
      lastSyncedAt: cursor.lastSyncedAt?.toISOString() ?? null,
      lastError: cursor.lastError,
    })),
    hasSmtpSecrets: Boolean(config.smtp.user && config.smtp.pass),
    hasImapSecrets: Boolean(config.imap.user && config.imap.pass),
  };
}

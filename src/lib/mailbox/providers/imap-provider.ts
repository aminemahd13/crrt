import { ImapFlow, type SearchObject } from "imapflow";
import { simpleParser } from "mailparser";
import type {
  FolderSyncResult,
  MailboxProvider,
  ProviderAttachment,
  ProviderMessage,
} from "@/lib/mailbox/types";
import {
  deriveThreadKey,
  normalizeMessageId,
  normalizeReferences,
  pickPrimaryAddress,
  sanitizeHtmlBody,
  toMailboxAddresses,
  toSnippet,
} from "@/lib/mailbox/utils";

interface ImapProviderConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

export class ImapMailboxProvider implements MailboxProvider {
  private readonly client: ImapFlow;
  private connected = false;

  constructor(private readonly config: ImapProviderConfig) {
    this.client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      disableAutoIdle: true,
      connectionTimeout: 30_000,
      greetingTimeout: 15_000,
      socketTimeout: 60_000,
      logger: false,
    });
  }

  private async ensureConnected(): Promise<void> {
    if (this.connected && this.client.usable) return;
    await this.client.connect();
    this.connected = true;
  }

  private async parseMessage(
    source: Buffer,
    input: {
      folderName: string;
      uid: number;
      uidValidity: bigint;
      isRead: boolean;
      isFlagged: boolean;
      internalDate: Date | null;
      mailboxAddress: string;
    }
  ): Promise<ProviderMessage> {
    const parsed = await simpleParser(source);
    const toAddresses = toMailboxAddresses(parsed.to);
    const ccAddresses = toMailboxAddresses(parsed.cc);
    const bccAddresses = toMailboxAddresses(parsed.bcc);
    const fromAddress = pickPrimaryAddress(toMailboxAddresses(parsed.from));

    const messageId = normalizeMessageId(parsed.messageId);
    const inReplyTo = normalizeMessageId(parsed.inReplyTo);
    const referencesRaw = Array.isArray(parsed.references)
      ? parsed.references
      : typeof parsed.references === "string"
        ? parsed.references.split(/\s+/)
        : [];
    const references = normalizeReferences(referencesRaw);
    const subject = parsed.subject?.trim() || "";
    const htmlBody = sanitizeHtmlBody(parsed.html ? String(parsed.html) : null);
    const textBody = parsed.text?.trim() || null;
    const date = parsed.date ?? input.internalDate ?? new Date();
    const fromEmail = fromAddress?.address ?? null;
    const threadKey = deriveThreadKey({
      references,
      inReplyTo,
      messageId,
      subject,
      date,
      fromEmail,
    });

    const attachments: ProviderAttachment[] = parsed.attachments.map((attachment) => ({
      filename: attachment.filename || "attachment.bin",
      mimeType: attachment.contentType || "application/octet-stream",
      size: attachment.size ?? attachment.content.byteLength,
      contentId: attachment.contentId ?? null,
      isInline: attachment.contentDisposition === "inline",
      transferEncoding: attachment.transferEncoding ?? null,
      rawContent: attachment.content ?? null,
    }));

    return {
      threadKey,
      messageIdHeader: messageId,
      inReplyTo,
      references,
      folderName: input.folderName,
      uidValidity: input.uidValidity,
      uid: input.uid,
      from: fromAddress,
      to: toAddresses,
      cc: ccAddresses,
      bcc: bccAddresses,
      subject,
      snippet: toSnippet(textBody, htmlBody),
      textBody,
      htmlBody,
      rawMime: source,
      rawMimeEncoding: "identity",
      date,
      internalDate: input.internalDate,
      isRead: input.isRead,
      isFlagged: input.isFlagged,
      direction: fromEmail === input.mailboxAddress.toLowerCase() ? "outbound" : "inbound",
      attachments,
    };
  }

  async verify(): Promise<{ ok: boolean; details?: Record<string, unknown>; error?: string }> {
    try {
      await this.ensureConnected();
      const mailboxes = await this.client.list();
      return {
        ok: true,
        details: {
          mailboxCount: mailboxes.length,
          secureConnection: this.client.secureConnection,
          user: this.config.user,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async syncFolder(input: {
    folderName: string;
    cursorUidValidity: bigint | null;
    cursorHighestUid: number | null;
    sinceDate: Date;
    mailboxAddress: string;
  }): Promise<FolderSyncResult> {
    await this.ensureConnected();
    const lock = await this.client.getMailboxLock(input.folderName, { description: "mailbox-sync" });

    try {
      const mailbox = this.client.mailbox;
      if (!mailbox) {
        throw new Error(`Mailbox ${input.folderName} is not selected.`);
      }
      const uidValidity = mailbox.uidValidity;
      const reset = input.cursorUidValidity !== null && input.cursorUidValidity !== uidValidity;
      const shouldIncremental = !reset && input.cursorHighestUid !== null && input.cursorHighestUid > 0;

      let candidateUids: number[] = [];
      if (shouldIncremental) {
        const startUid = (input.cursorHighestUid ?? 0) + 1;
        const query: SearchObject = {
          uid: `${startUid}:*`,
        };
        candidateUids = (await this.client.search(query, { uid: true })) || [];
      } else {
        const query: SearchObject = {
          since: input.sinceDate,
        };
        candidateUids = (await this.client.search(query, { uid: true })) || [];
      }

      const sortedUids = [...candidateUids].sort((a, b) => a - b);
      const messages: ProviderMessage[] = [];

      for (const uidBatch of chunk(sortedUids, 50)) {
        for await (const fetched of this.client.fetch(
          uidBatch,
          {
            uid: true,
            flags: true,
            internalDate: true,
            source: true,
          },
          { uid: true }
        )) {
          if (!fetched.source) continue;
          const isRead = fetched.flags?.has("\\Seen") ?? false;
          const isFlagged = fetched.flags?.has("\\Flagged") ?? false;
          const internalDate =
            fetched.internalDate instanceof Date
              ? fetched.internalDate
              : fetched.internalDate
                ? new Date(fetched.internalDate)
                : null;

          const parsed = await this.parseMessage(fetched.source, {
            folderName: input.folderName,
            uid: fetched.uid,
            uidValidity,
            isRead,
            isFlagged,
            internalDate,
            mailboxAddress: input.mailboxAddress,
          });
          messages.push(parsed);
        }
      }

      const updateStart = Math.max(1, (input.cursorHighestUid ?? mailbox.exists) - 300);
      const flagUids = (await this.client.search({ uid: `${updateStart}:*` }, { uid: true })) || [];
      const flagUpdates: FolderSyncResult["flagUpdates"] = [];
      for (const uidBatch of chunk(flagUids.sort((a, b) => a - b), 200)) {
        for await (const fetched of this.client.fetch(
          uidBatch,
          { uid: true, flags: true, internalDate: true },
          { uid: true }
        )) {
          const isRead = fetched.flags?.has("\\Seen") ?? false;
          const isFlagged = fetched.flags?.has("\\Flagged") ?? false;
          const internalDate =
            fetched.internalDate instanceof Date
              ? fetched.internalDate
              : fetched.internalDate
                ? new Date(fetched.internalDate)
                : null;
          flagUpdates.push({
            uid: fetched.uid,
            isRead,
            isFlagged,
            internalDate,
          });
        }
      }

      return {
        folderName: input.folderName,
        uidValidity,
        highestUid: mailbox.uidNext ? mailbox.uidNext - 1 : input.cursorHighestUid,
        reset,
        messages,
        flagUpdates,
      };
    } finally {
      lock.release();
    }
  }

  async setSeen(input: { folderName: string; uid: number; seen: boolean }): Promise<void> {
    await this.ensureConnected();
    const lock = await this.client.getMailboxLock(input.folderName, { description: "mailbox-set-seen" });
    try {
      if (input.seen) {
        await this.client.messageFlagsAdd([input.uid], ["\\Seen"], { uid: true });
      } else {
        await this.client.messageFlagsRemove([input.uid], ["\\Seen"], { uid: true });
      }
    } finally {
      lock.release();
    }
  }

  async moveMessage(input: {
    sourceFolder: string;
    uid: number;
    destinationFolder: string;
  }): Promise<void> {
    await this.ensureConnected();
    const lock = await this.client.getMailboxLock(input.sourceFolder, { description: "mailbox-move" });
    try {
      await this.client.messageMove([input.uid], input.destinationFolder, { uid: true });
    } finally {
      lock.release();
    }
  }

  async appendMessage(input: {
    folderName: string;
    content: Buffer;
    flags?: string[];
    date?: Date;
  }): Promise<{ uidValidity: bigint | null; uid: number | null }> {
    await this.ensureConnected();
    const appended = await this.client.append(
      input.folderName,
      input.content,
      input.flags ?? ["\\Seen"],
      input.date ?? new Date()
    );
    if (!appended) {
      return { uidValidity: null, uid: null };
    }
    return {
      uidValidity: appended.uidValidity ?? null,
      uid: appended.uid ?? null,
    };
  }

  async close(): Promise<void> {
    if (!this.connected) return;
    try {
      await this.client.logout();
    } catch {
      this.client.close();
    } finally {
      this.connected = false;
    }
  }
}

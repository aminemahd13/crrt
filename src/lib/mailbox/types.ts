import type { Attachment } from "nodemailer/lib/mailer";

export const MAILBOX_FOLDER_KEYS = ["inbox", "sent", "drafts", "archive", "trash"] as const;

export type MailboxFolderKey = (typeof MAILBOX_FOLDER_KEYS)[number];

export interface MailboxAddress {
  name: string | null;
  address: string;
}

export interface MailboxFolderConfig {
  inbox: string;
  sent: string;
  drafts: string;
  archive: string;
  trash: string;
}

export interface MailboxResolvedConfig {
  mailbox: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    replyTo: string;
  };
  imap: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  folders: MailboxFolderConfig;
  syncIntervalSeconds: number;
  initialSyncDays: number;
}

export interface ProviderAttachment {
  filename: string;
  mimeType: string;
  size: number;
  contentId: string | null;
  isInline: boolean;
  transferEncoding: string | null;
  rawContent: Buffer | null;
}

export interface ProviderMessage {
  threadKey: string;
  messageIdHeader: string | null;
  inReplyTo: string | null;
  references: string[];
  folderName: string;
  uidValidity: bigint;
  uid: number;
  from: MailboxAddress | null;
  to: MailboxAddress[];
  cc: MailboxAddress[];
  bcc: MailboxAddress[];
  subject: string;
  snippet: string | null;
  textBody: string | null;
  htmlBody: string | null;
  rawMime: Buffer | null;
  rawMimeEncoding: string | null;
  date: Date;
  internalDate: Date | null;
  isRead: boolean;
  isFlagged: boolean;
  direction: "inbound" | "outbound";
  attachments: ProviderAttachment[];
}

export interface FolderSyncResult {
  folderName: string;
  uidValidity: bigint;
  highestUid: number | null;
  reset: boolean;
  messages: ProviderMessage[];
  flagUpdates: Array<{
    uid: number;
    isRead: boolean;
    isFlagged: boolean;
    internalDate: Date | null;
  }>;
}

export interface MailboxProvider {
  verify(): Promise<{ ok: boolean; details?: Record<string, unknown>; error?: string }>;
  syncFolder(input: {
    folderName: string;
    cursorUidValidity: bigint | null;
    cursorHighestUid: number | null;
    sinceDate: Date;
    mailboxAddress: string;
  }): Promise<FolderSyncResult>;
  setSeen(input: { folderName: string; uid: number; seen: boolean }): Promise<void>;
  moveMessage(input: { sourceFolder: string; uid: number; destinationFolder: string }): Promise<{
    uidValidity: bigint | null;
    uid: number | null;
  }>;
  deleteMessage(input: { folderName: string; uid: number }): Promise<void>;
  appendMessage(input: {
    folderName: string;
    content: Buffer;
    flags?: string[];
    date?: Date;
  }): Promise<{ uidValidity: bigint | null; uid: number | null }>;
  close(): Promise<void>;
}

export interface OutgoingAttachmentInput {
  filename: string;
  mimeType: string;
  contentBase64: string;
}

export interface SendMailInput {
  to: MailboxAddress[];
  cc: MailboxAddress[];
  bcc: MailboxAddress[];
  subject: string;
  htmlBody: string;
  textBody: string;
  threadHeaders?: {
    inReplyTo?: string | null;
    references?: string[];
  };
  attachments: OutgoingAttachmentInput[];
}

export interface DraftPayload {
  to: MailboxAddress[];
  cc: MailboxAddress[];
  bcc: MailboxAddress[];
  subject: string;
  htmlBody: string;
  textBody: string;
  threadId: string | null;
  attachments: OutgoingAttachmentInput[];
}

export type OutgoingAttachment = Attachment & {
  filename: string;
  contentType: string;
  content: Buffer;
};

-- AlterTable
ALTER TABLE "PlatformSettings"
ADD COLUMN "imapHost" TEXT,
ADD COLUMN "imapPort" INTEGER,
ADD COLUMN "imapSecure" BOOLEAN,
ADD COLUMN "imapFolderInbox" TEXT,
ADD COLUMN "imapFolderSent" TEXT,
ADD COLUMN "imapFolderDrafts" TEXT,
ADD COLUMN "imapFolderArchive" TEXT,
ADD COLUMN "imapFolderTrash" TEXT,
ADD COLUMN "imapSyncIntervalSeconds" INTEGER,
ADD COLUMN "imapInitialSyncDays" INTEGER;

-- CreateTable
CREATE TABLE "MailThread" (
    "id" TEXT NOT NULL,
    "mailbox" TEXT NOT NULL DEFAULT 'shared',
    "threadKey" TEXT NOT NULL,
    "subject" TEXT,
    "participants" JSONB NOT NULL DEFAULT '[]',
    "snippet" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailMessage" (
    "id" TEXT NOT NULL,
    "mailbox" TEXT NOT NULL DEFAULT 'shared',
    "threadId" TEXT NOT NULL,
    "messageIdHeader" TEXT,
    "inReplyTo" TEXT,
    "references" JSONB NOT NULL DEFAULT '[]',
    "imapFolder" TEXT NOT NULL,
    "imapUidValidity" BIGINT,
    "imapUid" INTEGER,
    "fromName" TEXT,
    "fromEmail" TEXT,
    "toRecipients" JSONB NOT NULL DEFAULT '[]',
    "ccRecipients" JSONB NOT NULL DEFAULT '[]',
    "bccRecipients" JSONB NOT NULL DEFAULT '[]',
    "subject" TEXT NOT NULL DEFAULT '',
    "snippet" TEXT,
    "textBody" TEXT,
    "htmlBody" TEXT,
    "rawMime" BYTEA,
    "rawMimeEncoding" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "internalDate" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isSent" BOOLEAN NOT NULL DEFAULT false,
    "direction" TEXT NOT NULL DEFAULT 'inbound',
    "appendPending" BOOLEAN NOT NULL DEFAULT false,
    "appendError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contentId" TEXT,
    "isInline" BOOLEAN NOT NULL DEFAULT false,
    "rawContent" BYTEA,
    "transferEncoding" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailDraft" (
    "id" TEXT NOT NULL,
    "mailbox" TEXT NOT NULL DEFAULT 'shared',
    "threadId" TEXT,
    "remoteUidValidity" BIGINT,
    "remoteUid" INTEGER,
    "toRecipients" JSONB NOT NULL DEFAULT '[]',
    "ccRecipients" JSONB NOT NULL DEFAULT '[]',
    "bccRecipients" JSONB NOT NULL DEFAULT '[]',
    "subject" TEXT NOT NULL DEFAULT '',
    "htmlBody" TEXT NOT NULL DEFAULT '',
    "textBody" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastError" TEXT,
    "createdByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailDraftAttachment" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailDraftAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailFolderCursor" (
    "id" TEXT NOT NULL,
    "mailbox" TEXT NOT NULL DEFAULT 'shared',
    "folderKey" TEXT NOT NULL,
    "folderName" TEXT NOT NULL,
    "uidValidity" BIGINT,
    "highestUid" INTEGER,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'idle',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailFolderCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MailThread_mailbox_threadKey_key" ON "MailThread"("mailbox", "threadKey");

-- CreateIndex
CREATE INDEX "MailThread_mailbox_lastMessageAt_idx" ON "MailThread"("mailbox", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "MailMessage_imapFolder_imapUidValidity_imapUid_key" ON "MailMessage"("imapFolder", "imapUidValidity", "imapUid");

-- CreateIndex
CREATE INDEX "MailMessage_mailbox_imapFolder_date_idx" ON "MailMessage"("mailbox", "imapFolder", "date");

-- CreateIndex
CREATE INDEX "MailMessage_threadId_date_idx" ON "MailMessage"("threadId", "date");

-- CreateIndex
CREATE INDEX "MailMessage_messageIdHeader_idx" ON "MailMessage"("messageIdHeader");

-- CreateIndex
CREATE INDEX "MailAttachment_messageId_idx" ON "MailAttachment"("messageId");

-- CreateIndex
CREATE INDEX "MailDraft_mailbox_updatedAt_idx" ON "MailDraft"("mailbox", "updatedAt");

-- CreateIndex
CREATE INDEX "MailDraftAttachment_draftId_idx" ON "MailDraftAttachment"("draftId");

-- CreateIndex
CREATE UNIQUE INDEX "MailFolderCursor_mailbox_folderKey_key" ON "MailFolderCursor"("mailbox", "folderKey");

-- AddForeignKey
ALTER TABLE "MailMessage" ADD CONSTRAINT "MailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailAttachment" ADD CONSTRAINT "MailAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailDraft" ADD CONSTRAINT "MailDraft_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MailThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailDraftAttachment" ADD CONSTRAINT "MailDraftAttachment_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "MailDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

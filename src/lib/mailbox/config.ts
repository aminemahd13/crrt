import { getPlatformSettingsSnapshot } from "@/lib/site-config";
import type { MailboxResolvedConfig } from "@/lib/mailbox/types";

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
}

function parsePositive(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeFolderName(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function normalizeFrom(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

export async function resolveMailboxConfig(): Promise<MailboxResolvedConfig> {
  const settings = await getPlatformSettingsSnapshot();
  const smtpUser = process.env.SMTP_USER?.trim() ?? "";
  const smtpPass = process.env.SMTP_PASS?.trim() ?? "";
  const imapUser = process.env.IMAP_USER?.trim() ?? "";
  const imapPass = process.env.IMAP_PASS?.trim() ?? "";

  return {
    mailbox: "shared",
    smtp: {
      host: settings.smtpHost.trim() || process.env.SMTP_HOST?.trim() || "mail.purelymail.com",
      port: settings.smtpPort || parsePort(process.env.SMTP_PORT, 587),
      secure: (settings.smtpPort || parsePort(process.env.SMTP_PORT, 587)) === 465,
      user: smtpUser,
      pass: smtpPass,
      from: normalizeFrom(
        settings.smtpFrom,
        normalizeFrom(process.env.SMTP_FROM, `CRRT <${smtpUser || "contact@crrt.tech"}>`)
      ),
      replyTo: settings.adminEmail.trim() || process.env.ADMIN_EMAIL?.trim() || "contact@crrt.tech",
    },
    imap: {
      host: settings.imapHost.trim() || process.env.IMAP_HOST?.trim() || "mail.purelymail.com",
      port: settings.imapPort || parsePort(process.env.IMAP_PORT, 993),
      secure: typeof settings.imapSecure === "boolean"
        ? settings.imapSecure
        : parseBoolean(process.env.IMAP_SECURE, true),
      user: imapUser,
      pass: imapPass,
    },
    folders: {
      inbox: normalizeFolderName(settings.imapFolderInbox, process.env.IMAP_FOLDER_INBOX ?? "INBOX"),
      sent: normalizeFolderName(settings.imapFolderSent, process.env.IMAP_FOLDER_SENT ?? "Sent"),
      drafts: normalizeFolderName(settings.imapFolderDrafts, process.env.IMAP_FOLDER_DRAFTS ?? "Drafts"),
      archive: normalizeFolderName(settings.imapFolderArchive, process.env.IMAP_FOLDER_ARCHIVE ?? "Archive"),
      trash: normalizeFolderName(settings.imapFolderTrash, process.env.IMAP_FOLDER_TRASH ?? "Trash"),
    },
    syncIntervalSeconds: settings.imapSyncIntervalSeconds
      || parsePositive(process.env.IMAP_SYNC_INTERVAL_SECONDS, 30),
    initialSyncDays: settings.imapInitialSyncDays
      || parsePositive(process.env.IMAP_INITIAL_SYNC_DAYS, 90),
  };
}

export function assertSmtpConfigured(config: MailboxResolvedConfig): void {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    throw new Error("SMTP credentials are not fully configured.");
  }
}

export function assertImapConfigured(config: MailboxResolvedConfig): void {
  if (!config.imap.host || !config.imap.user || !config.imap.pass) {
    throw new Error("IMAP credentials are not fully configured.");
  }
}

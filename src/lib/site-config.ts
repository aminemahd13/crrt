import { prisma } from "@/lib/prisma";

export interface SiteLink {
  label: string;
  href: string;
}

export interface PublicNavigationConfig {
  header: SiteLink[];
  footer: SiteLink[];
}

export interface PlatformSettingsSnapshot {
  siteTitle: string;
  siteUrl: string;
  adminEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpFrom: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapFolderInbox: string;
  imapFolderSent: string;
  imapFolderDrafts: string;
  imapFolderArchive: string;
  imapFolderTrash: string;
  imapSyncIntervalSeconds: number;
  imapInitialSyncDays: number;
}

const DEFAULT_HEADER_LINKS: SiteLink[] = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Projects", href: "/projects" },
  { label: "Resources", href: "/resources" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

const DEFAULT_FOOTER_LINKS: SiteLink[] = [
  { label: "Our Mission", href: "/about" },
  { label: "Team", href: "/about#team" },
  { label: "Timeline", href: "/about#timeline" },
  { label: "Contact Us", href: "mailto:contact@crrt.tech" },
];

function normalizeString(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePort(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function toLinks(items: Array<{ label: string; href: string }>): SiteLink[] {
  return items
    .map((item) => ({
      label: normalizeString(item.label),
      href: normalizeString(item.href),
    }))
    .filter((item) => item.label.length > 0 && item.href.length > 0);
}

export function getDefaultPlatformSettings(): PlatformSettingsSnapshot {
  const envPort = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
  const imapPort = Number.parseInt(process.env.IMAP_PORT ?? "993", 10);
  const syncInterval = Number.parseInt(process.env.IMAP_SYNC_INTERVAL_SECONDS ?? "30", 10);
  const initialSyncDays = Number.parseInt(process.env.IMAP_INITIAL_SYNC_DAYS ?? "90", 10);
  return {
    siteTitle: "CRRT - ENSA Agadir",
    siteUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    adminEmail: process.env.ADMIN_EMAIL ?? "contact@crrt.tech",
    smtpHost: process.env.SMTP_HOST ?? "mail.purelymail.com",
    smtpPort: Number.isFinite(envPort) ? envPort : 587,
    smtpFrom: process.env.SMTP_FROM ?? "CRRT <contact@crrt.tech>",
    imapHost: process.env.IMAP_HOST ?? "mail.purelymail.com",
    imapPort: Number.isFinite(imapPort) ? imapPort : 993,
    imapSecure: (process.env.IMAP_SECURE ?? "true").toLowerCase() !== "false",
    imapFolderInbox: process.env.IMAP_FOLDER_INBOX ?? "INBOX",
    imapFolderSent: process.env.IMAP_FOLDER_SENT ?? "Sent",
    imapFolderDrafts: process.env.IMAP_FOLDER_DRAFTS ?? "Drafts",
    imapFolderArchive: process.env.IMAP_FOLDER_ARCHIVE ?? "Archive",
    imapFolderTrash: process.env.IMAP_FOLDER_TRASH ?? "Trash",
    imapSyncIntervalSeconds: Number.isFinite(syncInterval) ? syncInterval : 30,
    imapInitialSyncDays: Number.isFinite(initialSyncDays) ? initialSyncDays : 90,
  };
}

export async function getPlatformSettingsSnapshot(): Promise<PlatformSettingsSnapshot> {
  const defaults = getDefaultPlatformSettings();
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: {
        siteTitle: true,
        siteUrl: true,
        adminEmail: true,
        smtpHost: true,
        smtpPort: true,
        smtpFrom: true,
        imapHost: true,
        imapPort: true,
        imapSecure: true,
        imapFolderInbox: true,
        imapFolderSent: true,
        imapFolderDrafts: true,
        imapFolderArchive: true,
        imapFolderTrash: true,
        imapSyncIntervalSeconds: true,
        imapInitialSyncDays: true,
      },
    });

    if (!settings) {
      return defaults;
    }

    return {
      siteTitle: normalizeString(settings.siteTitle) || defaults.siteTitle,
      siteUrl: normalizeString(settings.siteUrl) || defaults.siteUrl,
      adminEmail: normalizeString(settings.adminEmail) || defaults.adminEmail,
      smtpHost: normalizeString(settings.smtpHost) || defaults.smtpHost,
      smtpPort: normalizePort(settings.smtpPort, defaults.smtpPort),
      smtpFrom: normalizeString(settings.smtpFrom) || defaults.smtpFrom,
      imapHost: normalizeString(settings.imapHost) || defaults.imapHost,
      imapPort: normalizePort(settings.imapPort, defaults.imapPort),
      imapSecure:
        typeof settings.imapSecure === "boolean"
          ? settings.imapSecure
          : defaults.imapSecure,
      imapFolderInbox: normalizeString(settings.imapFolderInbox) || defaults.imapFolderInbox,
      imapFolderSent: normalizeString(settings.imapFolderSent) || defaults.imapFolderSent,
      imapFolderDrafts:
        normalizeString(settings.imapFolderDrafts) || defaults.imapFolderDrafts,
      imapFolderArchive:
        normalizeString(settings.imapFolderArchive) || defaults.imapFolderArchive,
      imapFolderTrash: normalizeString(settings.imapFolderTrash) || defaults.imapFolderTrash,
      imapSyncIntervalSeconds: normalizePort(
        settings.imapSyncIntervalSeconds,
        defaults.imapSyncIntervalSeconds
      ),
      imapInitialSyncDays: normalizePort(
        settings.imapInitialSyncDays,
        defaults.imapInitialSyncDays
      ),
    };
  } catch {
    return defaults;
  }
}

export async function getPublicNavigationConfig(): Promise<PublicNavigationConfig> {
  try {
    const configuredItems = await prisma.navItem.findMany({
      where: { section: { in: ["header", "footer"] } },
      orderBy: [{ section: "asc" }, { order: "asc" }],
      select: {
        label: true,
        href: true,
        section: true,
        visible: true,
      },
    });

    const headerConfigured = configuredItems.some((item) => item.section === "header");
    const footerConfigured = configuredItems.some((item) => item.section === "footer");

    const headerVisible = toLinks(
      configuredItems
        .filter((item) => item.section === "header" && item.visible)
        .map((item) => ({ label: item.label, href: item.href }))
    );
    const footerVisible = toLinks(
      configuredItems
        .filter((item) => item.section === "footer" && item.visible)
        .map((item) => ({ label: item.label, href: item.href }))
    );

    return {
      header: headerConfigured ? headerVisible : DEFAULT_HEADER_LINKS,
      footer: footerConfigured ? footerVisible : DEFAULT_FOOTER_LINKS,
    };
  } catch {
    return {
      header: DEFAULT_HEADER_LINKS,
      footer: DEFAULT_FOOTER_LINKS,
    };
  }
}

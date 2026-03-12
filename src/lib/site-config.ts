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
  { label: "Contact Us", href: "mailto:crrt@ensa-agadir.ac.ma" },
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
  return {
    siteTitle: "CRRT - ENSA Agadir",
    siteUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    adminEmail: process.env.ADMIN_EMAIL ?? "",
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: Number.isFinite(envPort) ? envPort : 587,
    smtpFrom: process.env.SMTP_FROM ?? "",
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


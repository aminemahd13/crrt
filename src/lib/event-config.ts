import type { CSSProperties } from "react";

export const EVENT_TYPES = [
  "training",
  "conference",
  "competition",
  "workshop",
  "hackathon",
] as const;

export const EVENT_THEME_PRESETS = [
  "default",
  "ocean",
  "forest",
  "sunset",
  "slate",
] as const;

export const EVENT_REGISTRATION_MODES = [
  "closed",
  "internal",
  "external",
] as const;

export type EventThemePreset = (typeof EVENT_THEME_PRESETS)[number];
export type EventRegistrationMode = (typeof EVENT_REGISTRATION_MODES)[number];

const EVENT_THEME_ACCENTS: Record<EventThemePreset, string> = {
  default: "#F97316",
  ocean: "#0EA5E9",
  forest: "#22C55E",
  sunset: "#FB7185",
  slate: "#94A3B8",
};

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const ABSOLUTE_HTTP_URL_REGEX = /^https?:\/\//i;

export function isValidEventThemePreset(value: string): value is EventThemePreset {
  return EVENT_THEME_PRESETS.includes(value as EventThemePreset);
}

export function isValidEventRegistrationMode(value: string): value is EventRegistrationMode {
  return EVENT_REGISTRATION_MODES.includes(value as EventRegistrationMode);
}

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value);
}

export function isValidInternalOrExternalUrl(value: string): boolean {
  return value.startsWith("/") || ABSOLUTE_HTTP_URL_REGEX.test(value);
}

export function isAbsoluteHttpUrl(value: string): boolean {
  return ABSOLUTE_HTTP_URL_REGEX.test(value);
}

export function getVisibleEventsWhere(now: Date = new Date()) {
  return {
    published: true,
    AND: [
      {
        OR: [{ publishStart: null }, { publishStart: { lte: now } }],
      },
      {
        OR: [{ publishEnd: null }, { publishEnd: { gte: now } }],
      },
    ],
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;
  const value = Number.parseInt(expanded, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function resolveEventAccent(
  themePreset?: string | null,
  themeAccent?: string | null
): string {
  if (themeAccent && isValidHexColor(themeAccent)) {
    return themeAccent;
  }
  if (themePreset && isValidEventThemePreset(themePreset)) {
    return EVENT_THEME_ACCENTS[themePreset];
  }
  return EVENT_THEME_ACCENTS.default;
}

export function getEventThemeStyles(
  themePreset?: string | null,
  themeAccent?: string | null
) {
  const accent = resolveEventAccent(themePreset, themeAccent);
  const [r, g, b] = hexToRgb(accent);
  const soft = `rgba(${r}, ${g}, ${b}, 0.12)`;
  const border = `rgba(${r}, ${g}, ${b}, 0.3)`;
  const glow = `rgba(${r}, ${g}, ${b}, 0.18)`;
  const muted = `rgba(${r}, ${g}, ${b}, 0.08)`;

  const scopeStyle = {
    ["--event-accent" as const]: accent,
    ["--event-accent-soft" as const]: soft,
    ["--event-accent-border" as const]: border,
    ["--event-accent-glow" as const]: glow,
    ["--event-accent-muted" as const]: muted,
  } as CSSProperties;

  return {
    scopeStyle,
    accent,
    badgeStyle: {
      color: "var(--event-accent)",
      backgroundColor: "var(--event-accent-soft)",
      borderColor: "var(--event-accent-border)",
    } as CSSProperties,
    buttonStyle: {
      backgroundColor: "var(--event-accent)",
    } as CSSProperties,
    buttonSubtleStyle: {
      color: "var(--event-accent)",
      borderColor: "var(--event-accent-border)",
      backgroundColor: "var(--event-accent-muted)",
    } as CSSProperties,
    iconStyle: {
      color: "var(--event-accent)",
    } as CSSProperties,
    glowStyle: {
      backgroundColor: "var(--event-accent-glow)",
    } as CSSProperties,
  };
}

interface EventRegistrationInput {
  registrationMode?: string | null;
  registrationLabel?: string | null;
  registrationUrl?: string | null;
  defaultHref?: string | null;
}

export function getEventRegistrationConfig(input: EventRegistrationInput) {
  const mode = isValidEventRegistrationMode(input.registrationMode ?? "")
    ? input.registrationMode
    : "internal";
  const url = input.registrationUrl?.trim() || null;
  const label = input.registrationLabel?.trim() || null;

  if (mode === "closed") {
    return {
      mode,
      label: label ?? "Registration Closed",
      href: null,
      disabled: true,
      external: false,
    };
  }

  if (mode === "external") {
    return {
      mode,
      label: label ?? "Register Externally",
      href: url,
      disabled: !url,
      external: true,
    };
  }

  const internalHref = url ?? input.defaultHref ?? "/dashboard";
  return {
    mode,
    label: label ?? "Register Now",
    href: internalHref,
    disabled: false,
    external: isAbsoluteHttpUrl(internalHref),
  };
}

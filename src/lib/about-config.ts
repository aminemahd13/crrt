interface JsonRecord {
  [key: string]: unknown;
}

export interface AboutValueCard {
  title: string;
  desc: string;
}

export interface AboutConfigSnapshot {
  heroTitle: string;
  storyText: string;
  valueCards: AboutValueCard[];
  teamCurrentLabel: string;
  teamAlumniLabel: string;
  timelineHeading: string;
}

export const DEFAULT_ABOUT_CONFIG: AboutConfigSnapshot = {
  heroTitle: "About CRRT",
  storyText:
    "The Club Robotique & Recherche Technologique (CRRT) is ENSA Agadir's student-led engineering club, founded in 2008. We build robots, conduct research, and organize events that push the boundaries of what's possible with technology.",
  valueCards: [
    { title: "Innovation", desc: "Pushing boundaries through hands-on engineering and research." },
    { title: "Education", desc: "Training the next generation of engineers through workshops and mentoring." },
    { title: "Community", desc: "Building a network of passionate technologists across Morocco." },
  ],
  teamCurrentLabel: "Current Bureau",
  teamAlumniLabel: "Alumni",
  timelineHeading: "Since 2008",
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toAboutValueCards(value: unknown): AboutValueCard[] {
  if (!Array.isArray(value)) return [...DEFAULT_ABOUT_CONFIG.valueCards];

  const cards = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as JsonRecord;
      const title = normalizeText(row.title);
      const desc = normalizeText(row.desc);
      if (!title || !desc) return null;
      return { title, desc };
    })
    .filter((item): item is AboutValueCard => item !== null);

  return cards.length > 0 ? cards : [...DEFAULT_ABOUT_CONFIG.valueCards];
}

export function buildAboutConfigSnapshot(
  config: {
    heroTitle?: string | null;
    storyText?: string | null;
    valueCards?: unknown;
    teamCurrentLabel?: string | null;
    teamAlumniLabel?: string | null;
    timelineHeading?: string | null;
  } | null | undefined
): AboutConfigSnapshot {
  return {
    heroTitle: normalizeText(config?.heroTitle) || DEFAULT_ABOUT_CONFIG.heroTitle,
    storyText: normalizeText(config?.storyText) || DEFAULT_ABOUT_CONFIG.storyText,
    valueCards: toAboutValueCards(config?.valueCards),
    teamCurrentLabel:
      normalizeText(config?.teamCurrentLabel) || DEFAULT_ABOUT_CONFIG.teamCurrentLabel,
    teamAlumniLabel:
      normalizeText(config?.teamAlumniLabel) || DEFAULT_ABOUT_CONFIG.teamAlumniLabel,
    timelineHeading:
      normalizeText(config?.timelineHeading) || DEFAULT_ABOUT_CONFIG.timelineHeading,
  };
}

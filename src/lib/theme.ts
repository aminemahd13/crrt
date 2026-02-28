import { prisma } from "@/lib/prisma";

/**
 * Server-side helper to load theme settings and generate
 * CSS custom property overrides from the database.
 *
 * Called in the root layout (Server Component) to inject
 * a <style> tag so Theme Studio changes take effect site-wide.
 */

const glassBlurMap: Record<string, string> = {
    off: "0px",
    low: "8px",
    medium: "16px",
};

const shadowStrengthMap: Record<string, string> = {
    low: "0 2px 8px rgba(0,0,0,0.15)",
    medium: "0 4px 16px rgba(0,0,0,0.25)",
    high: "0 8px 32px rgba(0,0,0,0.35)",
};

export async function getThemeCSS(): Promise<string> {
    try {
        const theme = await prisma.themeSettings.findUnique({
            where: { id: "default" },
        });
        if (!theme) return "";

        return `
      :root {
        --signal-orange: ${theme.primaryColor};
        --signal-orange-hover: ${theme.accentColor};
        --midnight: ${theme.backgroundColor};
        --radius: ${theme.radius}px;
        --glass-blur: ${glassBlurMap[theme.glassIntensity] ?? "16px"};
        --shadow: ${shadowStrengthMap[theme.shadowStrength] ?? shadowStrengthMap.medium};
        --noise-opacity: ${theme.noiseOverlay === "off" ? "0" : "0.015"};
        --motion-duration: ${theme.motionLevel === "off" ? "0ms" : theme.motionLevel === "subtle" ? "150ms" : "300ms"};
        --motion-level: ${theme.motionLevel === "off" ? "0" : theme.motionLevel === "subtle" ? "0.5" : "1"};
      }

      ${theme.motionLevel === "off" ? `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }` : ""}

      .glass-surface {
        backdrop-filter: blur(${glassBlurMap[theme.glassIntensity] ?? "16px"});
        -webkit-backdrop-filter: blur(${glassBlurMap[theme.glassIntensity] ?? "16px"});
      }

      .noise-overlay::before {
        opacity: ${theme.noiseOverlay === "off" ? "0" : "0.015"};
      }
    `.trim();
    } catch {
        return "";
    }
}

export interface ThemeVariants {
    heroVariant: string;
    cardVariant: string;
    timelineVariant: string;
}

export async function getThemeVariants(): Promise<ThemeVariants> {
    try {
        const theme = await prisma.themeSettings.findUnique({
            where: { id: "default" },
        });
        return {
            heroVariant: theme?.heroVariant ?? "A",
            cardVariant: theme?.cardVariant ?? "elevated",
            timelineVariant: theme?.timelineVariant ?? "blueprint",
        };
    } catch {
        return { heroVariant: "A", cardVariant: "elevated", timelineVariant: "blueprint" };
    }
}

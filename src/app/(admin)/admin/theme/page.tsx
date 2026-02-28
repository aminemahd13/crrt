import { prisma } from "@/lib/prisma";
import { ThemeStudioClient } from "./theme-client";

export default async function ThemeStudioPage() {
  const theme = await prisma.themeSettings.findFirst({ where: { id: "default" } });

  return (
    <ThemeStudioClient
      theme={
        theme ?? {
          id: "default",
          primaryColor: "#F97316",
          backgroundColor: "#0F172A",
          accentColor: "#F97316",
          radius: 16,
          shadowStrength: "medium",
          glassIntensity: "medium",
          noiseOverlay: "subtle",
          motionLevel: "standard",
          heroVariant: "A",
          cardVariant: "elevated",
          timelineVariant: "blueprint",
          logoLight: null,
          logoDark: null,
          favicon: null,
        }
      }
    />
  );
}

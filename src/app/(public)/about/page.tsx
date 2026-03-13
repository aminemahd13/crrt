import { prisma } from "@/lib/prisma";
import { AboutPage } from "./about-client";
import { buildAboutConfigSnapshot } from "@/lib/about-config";

export default async function AboutServerPage() {
  const [milestones, members, aboutConfig] = await Promise.all([
    prisma.timelineMilestone.findMany({ orderBy: { order: "asc" } }),
    prisma.teamMember.findMany({ orderBy: { order: "asc" } }),
    prisma.aboutConfig.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <AboutPage
      config={buildAboutConfigSnapshot(aboutConfig)}
      milestones={milestones.map((m: any) => ({
        id: m.id,
        year: m.year,
        title: m.title,
        description: m.description,
      }))}
      members={members.map((m: any) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        image: m.image,
        isAlumni: m.isAlumni,
      }))}
    />
  );
}

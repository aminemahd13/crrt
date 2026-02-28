import { prisma } from "@/lib/prisma";
import { AboutPage } from "./about-client";

export default async function AboutServerPage() {
  const [milestones, members] = await Promise.all([
    prisma.timelineMilestone.findMany({ orderBy: { order: "asc" } }),
    prisma.teamMember.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <AboutPage
      milestones={milestones.map((m) => ({
        year: m.year,
        title: m.title,
        description: m.description,
      }))}
      members={members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        image: m.image,
        isAlumni: m.isAlumni,
      }))}
    />
  );
}

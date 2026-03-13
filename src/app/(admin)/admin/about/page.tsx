import { prisma } from "@/lib/prisma";
import { buildAboutConfigSnapshot } from "@/lib/about-config";
import { AboutStudioClient } from "./about-client";

export default async function AboutStudioPage() {
  const [config, members, milestones, partners] = await Promise.all([
    prisma.aboutConfig.findUnique({ where: { id: "default" } }),
    prisma.teamMember.findMany({ orderBy: { order: "asc" } }),
    prisma.timelineMilestone.findMany({ orderBy: { order: "asc" } }),
    prisma.partner.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <AboutStudioClient
      config={buildAboutConfigSnapshot(config)}
      members={members.map((member: any) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        image: member.image ?? "",
        linkedIn: member.linkedIn ?? "",
        isAlumni: member.isAlumni,
      }))}
      milestones={milestones.map((milestone: any) => ({
        id: milestone.id,
        year: String(milestone.year),
        title: milestone.title,
        description: milestone.description ?? "",
      }))}
      partners={partners.map((partner: any) => ({
        id: partner.id,
        name: partner.name,
        logoUrl: partner.logoUrl,
        website: partner.website ?? "",
      }))}
    />
  );
}

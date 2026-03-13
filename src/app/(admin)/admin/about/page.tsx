import { prisma } from "@/lib/prisma";
import { buildAboutConfigSnapshot } from "@/lib/about-config";
import { AboutStudioClient } from "./about-client";

type AboutConfigRecord = NonNullable<Parameters<typeof buildAboutConfigSnapshot>[0]>;

interface AboutConfigDelegate {
  findUnique(args: { where: { id: string } }): Promise<AboutConfigRecord | null>;
}

const aboutConfigDelegate = (prisma as unknown as { aboutConfig: AboutConfigDelegate }).aboutConfig;

export default async function AboutStudioPage() {
  const [config, members, milestones, partners] = await Promise.all([
    aboutConfigDelegate.findUnique({ where: { id: "default" } }),
    prisma.teamMember.findMany({ orderBy: { order: "asc" } }),
    prisma.timelineMilestone.findMany({ orderBy: { order: "asc" } }),
    prisma.partner.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <AboutStudioClient
      config={buildAboutConfigSnapshot(config)}
      members={members.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        image: member.image ?? "",
        linkedIn: member.linkedIn ?? "",
        isAlumni: member.isAlumni,
      }))}
      milestones={milestones.map((milestone) => ({
        id: milestone.id,
        year: String(milestone.year),
        title: milestone.title,
        description: milestone.description ?? "",
      }))}
      partners={partners.map((partner) => ({
        id: partner.id,
        name: partner.name,
        logoUrl: partner.logoUrl,
        website: partner.website ?? "",
      }))}
    />
  );
}

import { prisma } from "@/lib/prisma";
import { AboutPage } from "./about-client";
import { buildAboutConfigSnapshot } from "@/lib/about-config";

export const dynamic = "force-dynamic";

type AboutConfigRecord = NonNullable<Parameters<typeof buildAboutConfigSnapshot>[0]>;

interface AboutConfigDelegate {
  findUnique(args: { where: { id: string } }): Promise<AboutConfigRecord | null>;
}

const aboutConfigDelegate = (prisma as unknown as { aboutConfig: AboutConfigDelegate }).aboutConfig;

export default async function AboutServerPage() {
  const [milestones, members, aboutConfig] = await Promise.all([
    prisma.timelineMilestone.findMany({ orderBy: { order: "asc" } }),
    prisma.teamMember.findMany({ orderBy: { order: "asc" } }),
    aboutConfigDelegate.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <AboutPage
      config={buildAboutConfigSnapshot(aboutConfig)}
      milestones={milestones.map((m) => ({
        id: m.id,
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

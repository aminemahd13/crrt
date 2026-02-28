import { prisma } from "@/lib/prisma";
import { HomeStudioClient } from "./home-client";

export default async function HomeStudioPage() {
  const [config, events, projects] = await Promise.all([
    prisma.homeConfig.findFirst({ where: { id: "default" } }),
    prisma.event.findMany({ where: { published: true }, orderBy: { startDate: "asc" }, select: { id: true, title: true, slug: true } }),
    prisma.project.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, slug: true } }),
  ]);

  return (
    <HomeStudioClient
      config={{
        missionText: config?.missionText ?? "",
        tagline: config?.tagline ?? "",
        pinnedEventId: config?.pinnedEventId ?? null,
        featuredProjectIds: config?.featuredProjectIds ? JSON.parse(config.featuredProjectIds) : [],
        trackTagMap: config?.trackTagMap ? JSON.parse(config.trackTagMap) : [],
      }}
      events={events}
      projects={projects}
    />
  );
}

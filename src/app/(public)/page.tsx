import { prisma } from "@/lib/prisma";
import { getVisibleEventsWhere } from "@/lib/event-config";
import { HomeHero } from "./sections/home-hero";
import { HomeTracks } from "./sections/home-tracks";
import { HomeProjects } from "./sections/home-projects";
import { HomePosts } from "./sections/home-posts";
import { HomePartners } from "./sections/home-partners";
import { toStringArray, toTrackMap } from "@/lib/json";

export default async function HomePage() {
  const now = new Date();
  const [homeConfig, nextEvent, projects, posts, partners] = await Promise.all([
    prisma.homeConfig.findFirst({ where: { id: "default" } }),
    prisma.event.findFirst({
      where: {
        ...getVisibleEventsWhere(now),
        startDate: { gte: now },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.project.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.partner.findMany({ orderBy: { order: "asc" } }),
  ]);

  const tracks = toTrackMap(homeConfig?.trackTagMap);

  return (
    <div className="relative">
      <HomeHero
        missionText={homeConfig?.missionText ?? "Club Robotique & Recherche Technologique"}
        tagline={homeConfig?.tagline ?? "Our robots never sleep."}
        nextEvent={
          nextEvent
            ? {
                title: nextEvent.title,
                slug: nextEvent.slug,
                startDate: nextEvent.startDate.toISOString(),
                endDate: nextEvent.endDate?.toISOString() ?? null,
                location: nextEvent.location,
                type: nextEvent.type,
                description: nextEvent.description,
                themePreset: nextEvent.themePreset,
                themeAccent: nextEvent.themeAccent,
                registrationMode: nextEvent.registrationMode,
                registrationLabel: nextEvent.registrationLabel,
                registrationUrl: nextEvent.registrationUrl,
              }
            : null
        }
      />

      <HomeTracks tracks={tracks} />

      <HomeProjects
        projects={projects.map((p) => ({
          ...p,
          stackTags: toStringArray(p.stackTags),
        }))}
      />

      <HomePosts posts={posts} />

      {partners.length > 0 && <HomePartners partners={partners} />}
    </div>
  );
}

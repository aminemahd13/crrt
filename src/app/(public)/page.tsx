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
    prisma.homeConfig.findFirst({
      where: { id: "default" },
      select: {
        missionText: true,
        tagline: true,
        trackTagMap: true,
      },
    }),
    prisma.event.findFirst({
      where: {
        ...getVisibleEventsWhere(now),
        startDate: { gte: now },
      },
      orderBy: { startDate: "asc" },
      select: {
        title: true,
        slug: true,
        startDate: true,
        endDate: true,
        location: true,
        type: true,
        description: true,
        themePreset: true,
        themeAccent: true,
        registrationMode: true,
        registrationLabel: true,
        registrationUrl: true,
      },
    }),
    prisma.project.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        stackTags: true,
        year: true,
        repoUrl: true,
        demoUrl: true,
        coverImage: true,
      },
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        createdAt: true,
      },
    }),
    prisma.partner.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        website: true,
      },
    }),
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

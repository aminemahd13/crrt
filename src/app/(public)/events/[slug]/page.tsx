import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EventDetail } from "./event-detail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ACTIVE_REGISTRATION_STATUSES } from "@/lib/event-registration";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const now = new Date();
  const session = await getServerSession(authOptions);

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      speakers: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
      form: {
        include: {
          fields: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!event) return notFound();

  const isVisible =
    event.published &&
    (!event.publishStart || event.publishStart <= now) &&
    (!event.publishEnd || event.publishEnd >= now);
  if (!isVisible) return notFound();

  const [activeRegistrationCount, userRegistration] = await Promise.all([
    prisma.eventRegistration.count({
      where: {
        eventId: event.id,
        status: { in: ACTIVE_REGISTRATION_STATUSES },
      },
    }),
    session?.user?.id
      ? prisma.eventRegistration.findUnique({
          where: {
            eventId_userId: {
              eventId: event.id,
              userId: session.user.id,
            },
          },
        })
      : Promise.resolve(null),
  ]);

  // Pre-fill data from user profile
  let userProfile: { name?: string; email?: string; phone?: string; organization?: string; city?: string } | null = null;
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true, organization: true, city: true },
    });
    if (dbUser) {
      userProfile = {
        name: dbUser.name ?? undefined,
        email: dbUser.email ?? undefined,
        phone: dbUser.phone ?? undefined,
        organization: dbUser.organization ?? undefined,
        city: dbUser.city ?? undefined,
      };
    }
  }

  return (
    <EventDetail
      event={{
        ...event,
        id: event.id,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() ?? null,
        activeRegistrationCount,
        userRegistration: userRegistration
          ? {
              id: userRegistration.id,
              status: userRegistration.status,
            }
          : null,
        isAuthenticated: Boolean(session?.user?.id),
        themePreset: event.themePreset,
        themeAccent: event.themeAccent,
        registrationMode: event.registrationMode,
        registrationLabel: event.registrationLabel,
        registrationUrl: event.registrationUrl,
        registrationReviewMode: event.registrationReviewMode,
        speakers: event.speakers.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.role,
          bio: s.bio,
          image: s.image,
        })),
        tags: Array.from(new Set(event.tags.map((ct) => ct.tag.name))),
        formFields: event.form?.fields.map((f) => ({
          id: f.id,
          label: f.label,
          type: f.type,
          required: f.required,
          placeholder: f.placeholder,
          options: f.options,
        })) ?? [],
        userProfile,
      }}
    />
  );
}

import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_REGISTRATION_STATUSES } from "@/lib/event-registration";
import { EventApplyClient } from "./event-apply-client";

export default async function EventApplyPage({
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
      tags: { include: { tag: true } },
      form: {
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
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

  if (event.registrationMode !== "internal") {
    redirect(`/events/${event.slug}`);
  }

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

  let userProfile: {
    name?: string;
    email?: string;
    phone?: string;
    organization?: string;
    city?: string;
  } | null = null;
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
    <EventApplyClient
      event={{
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() ?? null,
        location: event.location,
        capacity: event.capacity,
        type: event.type,
        themePreset: event.themePreset,
        themeAccent: event.themeAccent,
        registrationLabel: event.registrationLabel,
        registrationReviewMode: event.registrationReviewMode,
        activeRegistrationCount,
        tags: Array.from(new Set(event.tags.map((ct) => ct.tag.name))),
        formFields:
          event.form?.fields.map((field) => ({
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder,
            options: field.options,
          })) ?? [],
      }}
      auth={{
        isAuthenticated: Boolean(session?.user?.id),
        userId: session?.user?.id ?? null,
      }}
      userRegistration={
        userRegistration
          ? {
              id: userRegistration.id,
              status: userRegistration.status,
            }
          : null
      }
      userProfile={userProfile}
    />
  );
}

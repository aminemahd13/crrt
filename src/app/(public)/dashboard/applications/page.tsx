import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toStringRecord } from "@/lib/json";
import { ApplicationsClient } from "./applications-client";

export default async function DashboardApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/applications");
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          location: true,
          type: true,
        },
      },
      formSubmission: {
        select: {
          id: true,
          status: true,
          data: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ApplicationsClient
      applications={registrations.map((registration) => ({
        id: registration.id,
        eventTitle: registration.event.title,
        eventSlug: registration.event.slug,
        eventDate: registration.event.startDate.toISOString(),
        eventLocation: registration.event.location,
        eventType: registration.event.type,
        registrationStatus: registration.status,
        reviewStatus: registration.formSubmission?.status
          ? (registration.formSubmission.status as "new" | "in_review" | "accepted" | "rejected")
          : null,
        note: registration.note,
        createdAt: registration.createdAt.toISOString(),
        updatedAt: registration.updatedAt.toISOString(),
        submissionData: toStringRecord(registration.formSubmission?.data),
      }))}
    />
  );
}

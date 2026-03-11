import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardServerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    redirect("/");
  }

  const [registrations, privateResources] = await Promise.all([
    prisma.eventRegistration.findMany({
      where: { userId: user.id },
      include: {
        event: {
          select: {
            title: true,
            slug: true,
            startDate: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.resource.findMany({
      where: { isPublic: false },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <DashboardClient
      user={{
        name: user.name || "",
        email: user.email || "",
        role: user.role,
        image: user.image || "",
        joinedAt: user.createdAt.toISOString(),
      }}
      registrations={registrations.map((item) => ({
        id: item.id,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        eventTitle: item.event.title,
        eventSlug: item.event.slug,
        eventDate: item.event.startDate.toISOString(),
        eventLocation: item.event.location,
      }))}
      privateResources={privateResources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        slug: resource.slug,
        description: resource.description,
        url: resource.url,
        type: resource.type,
        category: resource.category.name,
      }))}
    />
  );
}

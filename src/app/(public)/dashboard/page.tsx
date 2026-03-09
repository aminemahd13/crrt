import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Assuming standard authOptions location
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardServerPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
  });

  if (!user) {
    redirect("/");
  }

  // Fetch form submissions mapping to the user's email if possible
  // Since we don't have a rigid relation between user and forms, we can guess by data payload, or simply pass empty if unsupported.
  // Wait, let's see if there are any forms submitted by this user.
  const submissions = await prisma.formSubmission.findMany({
    where: {
      data: {
        contains: user.email as string,
      }
    },
    include: { form: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <DashboardClient 
      user={{
        name: user.name || "",
        email: user.email || "",
        role: user.role,
        image: user.image || "",
        joinedAt: user.createdAt.toISOString(),
      }}
      submissions={submissions.map(s => ({
        id: s.id,
        formTitle: s.form.title,
        status: s.status,
        date: s.createdAt.toISOString(),
      }))}
    />
  );
}

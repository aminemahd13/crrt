import { prisma } from "@/lib/prisma";
import { InboxClient } from "./inbox-client";

export default async function InboxPage() {
  const submissions = await prisma.formSubmission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      form: { select: { title: true } },
    },
  });

  return (
    <InboxClient
      submissions={submissions.map((s) => ({
        id: s.id,
        formTitle: s.form.title,
        data: s.data,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}

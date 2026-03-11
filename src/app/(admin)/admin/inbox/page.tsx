import { prisma } from "@/lib/prisma";
import { InboxClient } from "./inbox-client";
import { toStringRecord } from "@/lib/json";

export default async function InboxPage() {
  const submissions = await prisma.formSubmission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      form: { select: { title: true, event: { select: { title: true, slug: true } } } },
    },
  });

  return (
    <InboxClient
      submissions={submissions.map((s) => ({
        id: s.id,
        formTitle: s.form.event ? s.form.event.title : s.form.title,
        data: toStringRecord(s.data),
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}

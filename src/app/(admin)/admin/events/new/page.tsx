import { EventAdminWorkspace } from "@/components/admin/event-admin-workspace";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  return (
    <EventAdminWorkspace
      mode="create"
      initialData={{
        published: false,
        type: "training",
        themePreset: "default",
        registrationMode: "internal",
        registrationReviewMode: "auto",
        eventPartners: [],
      }}
      initialTab={tab}
    />
  );
}

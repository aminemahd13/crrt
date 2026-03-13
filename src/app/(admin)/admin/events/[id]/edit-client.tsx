"use client";

import { EventAdminWorkspace } from "@/components/admin/event-admin-workspace";
import type {
  ApplicationRow,
  RegistrationSection,
  RegistrationField,
} from "@/components/admin/events-admin-types";

export function EditEventClient({
  event,
  initialRegistrationSections = [],
  initialRegistrationFields = [],
  initialApplications = [],
  initialTab,
}: {
  event: Record<string, unknown>;
  initialRegistrationSections?: RegistrationSection[];
  initialRegistrationFields?: RegistrationField[];
  initialApplications?: ApplicationRow[];
  initialTab?: string | null;
}) {
  return (
    <EventAdminWorkspace
      mode="edit"
      initialData={event}
      initialRegistrationSections={initialRegistrationSections}
      initialRegistrationFields={initialRegistrationFields}
      initialApplications={initialApplications}
      initialTab={initialTab}
    />
  );
}

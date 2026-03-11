"use client";

import { EventAdminWorkspace } from "@/components/admin/event-admin-workspace";
import type {
  ApplicationRow,
  RegistrationField,
} from "@/components/admin/events-admin-types";

export function EditEventClient({
  event,
  initialRegistrationFields = [],
  initialApplications = [],
  initialTab,
}: {
  event: Record<string, unknown>;
  initialRegistrationFields?: RegistrationField[];
  initialApplications?: ApplicationRow[];
  initialTab?: string | null;
}) {
  return (
    <EventAdminWorkspace
      mode="edit"
      initialData={event}
      initialRegistrationFields={initialRegistrationFields}
      initialApplications={initialApplications}
      initialTab={initialTab}
    />
  );
}

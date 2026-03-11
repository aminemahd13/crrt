"use client";

import { EventAdminWorkspace } from "@/components/admin/event-admin-workspace";
import type {
  ApplicantRow,
  RegistrationField,
  ReviewQueueRow,
} from "@/components/admin/events-admin-types";

export function EditEventClient({
  event,
  initialRegistrationFields = [],
  initialRegistrations = [],
  initialReviewQueue = [],
  initialTab,
}: {
  event: Record<string, unknown>;
  initialRegistrationFields?: RegistrationField[];
  initialRegistrations?: ApplicantRow[];
  initialReviewQueue?: ReviewQueueRow[];
  initialTab?: string | null;
}) {
  return (
    <EventAdminWorkspace
      mode="edit"
      initialData={event}
      initialRegistrationFields={initialRegistrationFields}
      initialRegistrations={initialRegistrations}
      initialReviewQueue={initialReviewQueue}
      initialTab={initialTab}
    />
  );
}

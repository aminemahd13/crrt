import type { EventRegistrationStatus } from "@prisma/client";

export const ACTIVE_REGISTRATION_STATUSES: EventRegistrationStatus[] = ["registered", "approved"];

export function nextRegistrationStatus(
  capacity: number | null,
  activeCount: number
): EventRegistrationStatus {
  if (!capacity || capacity < 1) return "registered";
  return activeCount >= capacity ? "waitlisted" : "registered";
}

export function canCancelRegistration(status: EventRegistrationStatus): boolean {
  return status === "registered" || status === "waitlisted" || status === "approved";
}

export function registrationStatusLabel(status: EventRegistrationStatus): string {
  switch (status) {
    case "registered":
      return "Registered";
    case "waitlisted":
      return "Waitlisted";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

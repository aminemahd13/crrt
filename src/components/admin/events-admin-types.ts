export type EventAdminTab =
  | "details"
  | "registration"
  | "form-builder"
  | "applicants"
  | "review-queue";

export type EventHubTab = "events" | "applicants" | "review-queue";

export type RegistrationStatus =
  | "registered"
  | "waitlisted"
  | "approved"
  | "rejected"
  | "cancelled";

export type ReviewSubmissionStatus = "new" | "in_review" | "accepted" | "rejected";

export interface RegistrationField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string;
  order: number;
}

export interface EventListRow {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  type: string;
  date: string;
  registrationsCount: number;
}

export interface ApplicantRow {
  id: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  status: RegistrationStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewQueueRow {
  id: string;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  status: ReviewSubmissionStatus;
  createdAt: string;
  updatedAt: string;
  data: Record<string, string>;
  registrationId: string | null;
  registrationStatus: RegistrationStatus | null;
  applicantName: string | null;
  applicantEmail: string | null;
}

export type EventAdminTab =
  | "details"
  | "registration"
  | "form-builder"
  | "applications";

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

export interface EventFilterOption {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
}

export interface ApplicationRow {
  id: string;
  registrationId: string | null;
  submissionId: string | null;
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  registrationStatus: RegistrationStatus | null;
  reviewStatus: ReviewSubmissionStatus | null;
  note: string | null;
  submissionData: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationFilters {
  q?: string;
  eventId?: string;
  registrationStatus?: RegistrationStatus;
  reviewStatus?: ReviewSubmissionStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ApplicationUpdatePayload {
  status?: ReviewSubmissionStatus;
  data?: Record<string, string>;
}

export interface ApplicationsResponse {
  items: ApplicationRow[];
  total: number;
  page: number;
  pageSize: number;
  events: EventFilterOption[];
  truncated: boolean;
}

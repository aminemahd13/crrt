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

export type VisibilityOperator = "equals" | "contains" | "is_checked";

export interface VisibilityRule {
  sourceFieldId: string;
  operator: VisibilityOperator;
  value?: string;
}

export interface FileFieldConfig {
  accept: string[];
  maxSizeBytes: number;
}

export interface RegistrationFieldConfig {
  helperText?: string;
  file?: FileFieldConfig;
}

export interface RegistrationSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  visibility?: VisibilityRule | null;
}

export interface RegistrationField {
  id: string;
  sectionId?: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string;
  order: number;
  visibility?: VisibilityRule | null;
  config?: RegistrationFieldConfig;
}

export interface EventListRow {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  type: string;
  date: string;
  registrationsCount: number;
  capacity: number | null;
}

export interface EventFilterOption {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
}

export interface FileAnswerValue {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface SubmissionAnswer {
  type: string;
  value: string | FileAnswerValue;
}

export interface StructuredSubmissionData {
  schemaVersion: number;
  answers: Record<string, SubmissionAnswer>;
  legacy: {
    unmapped: Record<string, string>;
  };
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
  structuredSubmissionData?: StructuredSubmissionData;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationTimelineItem {
  key: string;
  label: string;
  timestamp: string | null;
}

export interface ApplicationDetail {
  id: string;
  registrationId: string | null;
  submissionId: string | null;
  event: {
    id: string;
    title: string;
    slug: string;
    startDate: string;
    endDate: string | null;
    location: string | null;
  };
  applicant: {
    userId: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    organization: string | null;
    city: string | null;
  };
  registration: {
    status: RegistrationStatus | null;
    note: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    waitlistedAt: string | null;
    approvedAt: string | null;
    rejectedAt: string | null;
    cancelledAt: string | null;
  };
  review: {
    status: ReviewSubmissionStatus | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  formSections: RegistrationSection[];
  formFields: RegistrationField[];
  displayData: Record<string, string>;
  structuredSubmissionData: StructuredSubmissionData | null;
  timeline: ApplicationTimelineItem[];
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

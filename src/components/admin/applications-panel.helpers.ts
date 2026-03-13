import type { ApplicationRow } from "@/components/admin/events-admin-types";

export interface ApplicationStatusCue {
  label: string;
  toneClassName: string;
}

export interface ApplicationColumnsConfig {
  key: string;
  label: string;
  className?: string;
}

const REVIEW_STATUS_CUES: Record<
  NonNullable<ApplicationRow["reviewStatus"]>,
  ApplicationStatusCue
> = {
  new: {
    label: "New",
    toneClassName: "bg-blue-400",
  },
  in_review: {
    label: "In review",
    toneClassName: "bg-amber-400",
  },
  accepted: {
    label: "Accepted",
    toneClassName: "bg-emerald-400",
  },
  rejected: {
    label: "Rejected",
    toneClassName: "bg-rose-400",
  },
};

const REGISTRATION_STATUS_CUES: Record<
  NonNullable<ApplicationRow["registrationStatus"]>,
  ApplicationStatusCue
> = {
  registered: {
    label: "Registered",
    toneClassName: "bg-blue-400",
  },
  waitlisted: {
    label: "Waitlisted",
    toneClassName: "bg-amber-400",
  },
  approved: {
    label: "Approved",
    toneClassName: "bg-emerald-400",
  },
  rejected: {
    label: "Rejected",
    toneClassName: "bg-rose-400",
  },
  cancelled: {
    label: "Cancelled",
    toneClassName: "bg-slate-400",
  },
};

export function getApplicationColumns(showEventColumn: boolean): ApplicationColumnsConfig[] {
  return [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "email",
      label: "Email",
    },
    ...(showEventColumn
      ? [
          {
            key: "event",
            label: "Event",
          },
        ]
      : []),
    {
      key: "date",
      label: "Date",
      className: "text-right",
    },
  ];
}

export function getApplicationStatusCue(row: ApplicationRow): ApplicationStatusCue {
  if (row.reviewStatus) {
    return REVIEW_STATUS_CUES[row.reviewStatus];
  }
  if (row.registrationStatus) {
    return REGISTRATION_STATUS_CUES[row.registrationStatus];
  }
  return {
    label: "No status",
    toneClassName: "bg-slate-500",
  };
}

export function formatApplicationDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function shouldOpenRowOnKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

export function shouldOpenRowInNewTab(
  event: Pick<MouseEvent, "button" | "ctrlKey" | "metaKey" | "shiftKey">
): boolean {
  if (event.button === 1) return true;
  return event.metaKey || event.ctrlKey || event.shiftKey;
}

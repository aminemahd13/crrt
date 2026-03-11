"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, FilePenLine, Trash2 } from "lucide-react";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFiltersBar } from "@/components/admin/admin-filters-bar";
import { ConfirmActionModal } from "@/components/admin/confirm-action-modal";
import { InlineStatusControl } from "@/components/admin/inline-status-control";
import { PayloadEditorDrawer } from "@/components/admin/payload-editor-drawer";
import {
  AdminToastViewport,
  useAdminToast,
} from "@/components/admin/admin-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ApplicationRow,
  RegistrationStatus,
  ReviewSubmissionStatus,
} from "@/components/admin/events-admin-types";

const REGISTRATION_STATUS_OPTIONS: RegistrationStatus[] = [
  "registered",
  "waitlisted",
  "approved",
  "rejected",
  "cancelled",
];

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  registered: "Registered",
  waitlisted: "Waitlisted",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const REVIEW_STATUS_OPTIONS: ReviewSubmissionStatus[] = [
  "new",
  "in_review",
  "accepted",
  "rejected",
];

const REVIEW_STATUS_LABELS: Record<ReviewSubmissionStatus, string> = {
  new: "New",
  in_review: "In Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ApplicationsPanel({
  initialRows,
  showEventColumn = true,
  showFilters = true,
  emptyMessage = "No applications found.",
  onRowsChange,
}: {
  initialRows: ApplicationRow[];
  showEventColumn?: boolean;
  showFilters?: boolean;
  emptyMessage?: string;
  onRowsChange?: (rows: ApplicationRow[]) => void;
}) {
  const [rows, setRows] = useState<ApplicationRow[]>(initialRows);
  const [query, setQuery] = useState("");
  const [registrationFilter, setRegistrationFilter] = useState<RegistrationStatus | "all">("all");
  const [reviewFilter, setReviewFilter] = useState<ReviewSubmissionStatus | "all">("all");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [updatingRegistrationId, setUpdatingRegistrationId] = useState<string | null>(null);
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState<string | null>(null);
  const [payloadRowId, setPayloadRowId] = useState<string | null>(null);
  const [confirmDeleteRowId, setConfirmDeleteRowId] = useState<string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);

  const { toasts, dismissToast, pushToast } = useAdminToast();

  useEffect(() => {
    setRows(initialRows);
    setNoteDraft({});
  }, [initialRows]);

  useEffect(() => {
    if (!onRowsChange) return;
    onRowsChange(rows);
  }, [onRowsChange, rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (registrationFilter !== "all" && row.registrationStatus !== registrationFilter) {
        return false;
      }
      if (reviewFilter !== "all" && row.reviewStatus !== reviewFilter) {
        return false;
      }
      if (!query.trim()) {
        return true;
      }
      const haystack = `${row.eventTitle} ${row.eventSlug} ${row.userName ?? ""} ${row.userEmail ?? ""} ${Object.values(
        row.submissionData
      ).join(" ")}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [query, registrationFilter, reviewFilter, rows]);

  const payloadRow = rows.find((row) => row.id === payloadRowId) ?? null;
  const deleteRow = rows.find((row) => row.id === confirmDeleteRowId) ?? null;

  const patchRow = (rowId: string, patch: Partial<ApplicationRow>) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleRegistrationUpdate = async (row: ApplicationRow, status: RegistrationStatus) => {
    if (!row.registrationId) return;

    setUpdatingRegistrationId(row.registrationId);
    const note = noteDraft[row.id] ?? row.note ?? "";

    try {
      const response = await fetch(
        `/api/admin/events/${row.eventId}/registrations/${row.registrationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, note }),
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        pushToast("error", payload.error ?? "Failed to update registration.");
        return;
      }

      const payload = (await response.json()) as {
        status: RegistrationStatus;
        note: string | null;
        updatedAt: string;
      };

      patchRow(row.id, {
        registrationStatus: payload.status,
        note: payload.note,
        updatedAt: payload.updatedAt,
      });
      pushToast("success", "Registration updated.");
    } catch {
      pushToast("error", "Failed to update registration.");
    } finally {
      setUpdatingRegistrationId(null);
    }
  };

  const handleReviewUpdate = async (row: ApplicationRow, status: ReviewSubmissionStatus) => {
    if (!row.submissionId) return;

    setUpdatingSubmissionId(row.submissionId);

    try {
      const response = await fetch(`/api/admin/submissions/${row.submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        pushToast("error", payload.error ?? "Failed to update review status.");
        return;
      }

      const payload = (await response.json()) as {
        status: ReviewSubmissionStatus;
        updatedAt: string;
      };

      patchRow(row.id, {
        reviewStatus: payload.status,
        updatedAt: payload.updatedAt,
      });
      pushToast("success", "Review status updated.");
    } catch {
      pushToast("error", "Failed to update review status.");
    } finally {
      setUpdatingSubmissionId(null);
    }
  };

  const handlePayloadSave = async (nextData: Record<string, string>) => {
    if (!payloadRow || !payloadRow.submissionId) return;

    setUpdatingSubmissionId(payloadRow.submissionId);

    try {
      const response = await fetch(`/api/admin/submissions/${payloadRow.submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: nextData }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        pushToast("error", payload.error ?? "Failed to update payload.");
        return;
      }

      const payload = (await response.json()) as {
        data: Record<string, string>;
        updatedAt: string;
      };

      patchRow(payloadRow.id, {
        submissionData: payload.data,
        updatedAt: payload.updatedAt,
      });
      setPayloadRowId(null);
      pushToast("success", "Submission payload updated.");
    } catch {
      pushToast("error", "Failed to update payload.");
    } finally {
      setUpdatingSubmissionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;

    setDeletingRowId(deleteRow.id);

    try {
      let response: Response;

      if (deleteRow.registrationId) {
        response = await fetch(
          `/api/admin/events/${deleteRow.eventId}/registrations/${deleteRow.registrationId}`,
          {
            method: "DELETE",
          }
        );
      } else if (deleteRow.submissionId) {
        response = await fetch(`/api/admin/submissions/${deleteRow.submissionId}`, {
          method: "DELETE",
        });
      } else {
        pushToast("error", "Cannot delete this application row.");
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        pushToast("error", payload.error ?? "Failed to delete application.");
        return;
      }

      removeRow(deleteRow.id);
      pushToast("success", "Application deleted.");
      setConfirmDeleteRowId(null);
    } catch {
      pushToast("error", "Failed to delete application.");
    } finally {
      setDeletingRowId(null);
    }
  };

  return (
    <div className="space-y-4">
      {showFilters ? (
        <AdminFiltersBar
          search={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search applications..."
        >
          <Select
            value={registrationFilter}
            onValueChange={(value) =>
              setRegistrationFilter(value as RegistrationStatus | "all")
            }
          >
            <SelectTrigger className="w-[190px] border-[var(--ghost-border)] bg-midnight-light text-ice-white">
              <SelectValue placeholder="All registration states" />
            </SelectTrigger>
            <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
              <SelectItem value="all">All registration states</SelectItem>
              {REGISTRATION_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {REGISTRATION_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={reviewFilter}
            onValueChange={(value) =>
              setReviewFilter(value as ReviewSubmissionStatus | "all")
            }
          >
            <SelectTrigger className="w-[170px] border-[var(--ghost-border)] bg-midnight-light text-ice-white">
              <SelectValue placeholder="All review states" />
            </SelectTrigger>
            <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
              <SelectItem value="all">All review states</SelectItem>
              {REVIEW_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {REVIEW_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AdminFiltersBar>
      ) : null}

      <AdminDataTable
        columns={[
          ...(showEventColumn
            ? [
                {
                  key: "event",
                  label: "Event",
                },
              ]
            : []),
          {
            key: "member",
            label: "Member",
          },
          {
            key: "registration",
            label: "Registration",
          },
          {
            key: "review",
            label: "Review",
          },
          {
            key: "note",
            label: "Note",
          },
          {
            key: "submission",
            label: "Submission",
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-right",
          },
        ]}
        empty={filteredRows.length === 0}
        emptyMessage={emptyMessage}
      >
        {filteredRows.map((row) => {
          const preview = Object.entries(row.submissionData)
            .slice(0, 2)
            .map(([key, value]) => `${key}: ${value}`)
            .join(" | ");

          return (
            <tr
              key={row.id}
              data-testid="application-row"
              data-registration-status={row.registrationStatus ?? ""}
              data-review-status={row.reviewStatus ?? ""}
              className="border-b border-[var(--ghost-border)] last:border-0 align-top"
            >
              {showEventColumn ? (
                <td className="px-4 py-3">
                  <p className="text-sm text-ice-white">{row.eventTitle}</p>
                  <p className="text-xs text-steel-gray">{row.eventSlug}</p>
                </td>
              ) : null}
              <td className="px-4 py-3">
                <p className="text-sm text-ice-white">{row.userName || "Unknown member"}</p>
                <p className="text-xs text-steel-gray">{row.userEmail || "No email"}</p>
              </td>
              <td className="px-4 py-3">
                <p className="mb-1 text-xs text-steel-gray">
                  {row.registrationStatus
                    ? REGISTRATION_STATUS_LABELS[row.registrationStatus]
                    : "No registration"}
                </p>
                {row.registrationId ? (
                  <InlineStatusControl
                    value={row.registrationStatus}
                    options={REGISTRATION_STATUS_OPTIONS}
                    labels={REGISTRATION_STATUS_LABELS}
                    disabled={updatingRegistrationId === row.registrationId}
                    onChange={(status) => {
                      void handleRegistrationUpdate(row, status);
                    }}
                  />
                ) : null}
              </td>
              <td className="px-4 py-3">
                <p className="mb-1 text-xs text-steel-gray">
                  {row.reviewStatus ? REVIEW_STATUS_LABELS[row.reviewStatus] : "No submission"}
                </p>
                {row.submissionId ? (
                  <InlineStatusControl
                    value={row.reviewStatus}
                    options={REVIEW_STATUS_OPTIONS}
                    labels={REVIEW_STATUS_LABELS}
                    disabled={updatingSubmissionId === row.submissionId}
                    onChange={(status) => {
                      void handleReviewUpdate(row, status);
                    }}
                  />
                ) : null}
              </td>
              <td className="px-4 py-3">
                <Input
                  type="text"
                  value={noteDraft[row.id] ?? row.note ?? ""}
                  onChange={(e) =>
                    setNoteDraft((prev) => ({
                      ...prev,
                      [row.id]: e.target.value,
                    }))
                  }
                  placeholder="Optional moderation note"
                  className="h-8 border-[var(--ghost-border)] bg-midnight text-xs text-ice-white"
                />
              </td>
              <td className="px-4 py-3">
                <p className="text-xs text-ice-white">{preview || "No payload"}</p>
                <p className="mt-1 text-[10px] text-steel-gray">Created {formatDate(row.createdAt)}</p>
                {row.submissionId ? (
                  <button
                    type="button"
                    onClick={() => setPayloadRowId(row.id)}
                    className="mt-1 inline-flex items-center gap-1 rounded-md border border-[var(--ghost-border)] px-2 py-1 text-[10px] text-steel-gray transition-colors hover:bg-white/5 hover:text-ice-white"
                  >
                    <FilePenLine size={11} /> Edit Payload
                  </button>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Link
                    href={`/admin/applications?eventId=${row.eventId}`}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--ghost-border)] px-2 py-1 text-[10px] text-steel-gray transition-colors hover:bg-white/5 hover:text-ice-white"
                  >
                    <ExternalLink size={11} /> Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteRowId(row.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-500/30 px-2 py-1 text-[10px] text-red-300 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </AdminDataTable>

      <PayloadEditorDrawer
        key={payloadRow ? `${payloadRow.id}:${payloadRow.updatedAt}` : "payload-drawer"}
        open={Boolean(payloadRow)}
        onOpenChange={(open) => {
          if (!open) setPayloadRowId(null);
        }}
        title="Edit Submission Payload"
        description="Only existing payload fields can be edited."
        value={payloadRow?.submissionData ?? {}}
        loading={Boolean(payloadRow?.submissionId && updatingSubmissionId === payloadRow.submissionId)}
        onSave={(next) => {
          void handlePayloadSave(next);
        }}
      />

      <ConfirmActionModal
        open={Boolean(deleteRow)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteRowId(null);
        }}
        title="Delete Application"
        description="This permanently deletes the application. Linked registration and submission records are also removed."
        confirmLabel="Delete Permanently"
        loading={Boolean(deleteRow && deletingRowId === deleteRow.id)}
        onConfirm={async () => {
          await handleDelete();
        }}
      />

      <AdminToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

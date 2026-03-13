"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import type {
  ApplicationDetail,
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

const REVIEW_STATUS_OPTIONS: ReviewSubmissionStatus[] = [
  "new",
  "in_review",
  "accepted",
  "rejected",
];

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatusLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ApplicationDetailClient({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get("returnTo");
  const returnTo = returnToRaw?.startsWith("/admin") ? returnToRaw : "/admin/review-queue";

  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | "none">("none");
  const [reviewStatus, setReviewStatus] = useState<ReviewSubmissionStatus | "none">("none");
  const [note, setNote] = useState("");
  const [payloadDraft, setPayloadDraft] = useState<Record<string, string>>({});

  const fileAnswers = useMemo(() => {
    if (!data?.structuredSubmissionData) return [];
    return Object.entries(data.structuredSubmissionData.answers).flatMap(([fieldId, answer]) => {
      if (typeof answer.value === "string") return [];
      return [
        {
          fieldId,
          label: data.formFields.find((field) => field.id === fieldId)?.label ?? fieldId,
          file: answer.value,
        },
      ];
    });
  }, [data]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Failed to load application.");
      }
      const payload = (await response.json()) as ApplicationDetail;
      setData(payload);
      setRegistrationStatus(payload.registration.status ?? "none");
      setReviewStatus(payload.review.status ?? "none");
      setNote(payload.registration.note ?? "");
      setPayloadDraft(payload.displayData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load application.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationStatus: registrationStatus === "none" ? undefined : registrationStatus,
          reviewStatus: reviewStatus === "none" ? undefined : reviewStatus,
          note,
          data: payloadDraft,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Failed to save changes.");
      }

      const payload = (await response.json()) as ApplicationDetail;
      setData(payload);
      setRegistrationStatus(payload.registration.status ?? "none");
      setReviewStatus(payload.review.status ?? "none");
      setNote(payload.registration.note ?? "");
      setPayloadDraft(payload.displayData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    if (!window.confirm("Delete this application and linked records permanently?")) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Failed to delete application.");
      }
      window.location.href = returnTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete application.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 mx-auto max-w-6xl">
        <div className="glass-card px-4 py-8 text-center text-sm text-steel-gray">
          Loading application...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 mx-auto max-w-6xl space-y-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error ?? "Application not found."}
        </div>
        <Button asChild variant="outline">
          <Link href={returnTo}>
            <ArrowLeft size={12} /> Back
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Application Detail"
        description={`${data.event.title} - ${data.applicant.name ?? data.applicant.email ?? "Unknown Applicant"}`}
      />

      <div className="sticky top-0 z-20 -mx-8 border-y border-[var(--ghost-border)] bg-midnight/95 px-8 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link
            href={returnTo}
            className="inline-flex items-center gap-1.5 text-xs text-steel-gray transition-colors hover:text-ice-white"
          >
            <ArrowLeft size={12} /> Back
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/40 text-red-300 hover:bg-red-500/10"
              onClick={() => {
                void handleDelete();
              }}
              disabled={deleting}
              data-testid="application-delete-button"
            >
              <Trash2 size={12} /> {deleting ? "Deleting..." : "Delete"}
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving}
              data-testid="application-save-button"
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-ice-white">Applicant snapshot</h2>
          <div className="space-y-1">
            <p className="text-sm text-ice-white">{data.applicant.name ?? "Unknown"}</p>
            <p className="text-xs text-steel-gray">{data.applicant.email ?? "No email"}</p>
            <p className="text-xs text-steel-gray">{data.applicant.phone ?? "No phone"}</p>
            <p className="text-xs text-steel-gray">
              {data.applicant.organization ?? "No organization"} / {data.applicant.city ?? "No city"}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2 text-xs text-steel-gray">
            Submitted: {formatDateTime(data.review.createdAt ?? data.registration.createdAt)}
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-ice-white">Workflow controls</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <Select
              value={registrationStatus}
              onValueChange={(value) => setRegistrationStatus(value as RegistrationStatus | "none")}
            >
              <SelectTrigger
                className="border-[var(--ghost-border)] bg-midnight text-ice-white"
                data-testid="application-registration-status"
              >
                <SelectValue placeholder="Registration status" />
              </SelectTrigger>
              <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                <SelectItem value="none">No registration</SelectItem>
                {REGISTRATION_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={reviewStatus}
              onValueChange={(value) => setReviewStatus(value as ReviewSubmissionStatus | "none")}
            >
              <SelectTrigger
                className="border-[var(--ghost-border)] bg-midnight text-ice-white"
                data-testid="application-review-status"
              >
                <SelectValue placeholder="Review status" />
              </SelectTrigger>
              <SelectContent className="border-[var(--ghost-border)] bg-midnight text-ice-white">
                <SelectItem value="none">No submission</SelectItem>
                {REVIEW_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Moderation note"
            className="border-[var(--ghost-border)] bg-midnight text-ice-white"
            data-testid="application-note"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-ice-white">Submission data</h2>
          {Object.keys(payloadDraft).length === 0 ? (
            <p className="text-xs text-steel-gray">No payload data.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(payloadDraft).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider text-steel-gray">{key}</label>
                  <Input
                    value={value}
                    onChange={(e) =>
                      setPayloadDraft((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    className="border-[var(--ghost-border)] bg-midnight text-ice-white"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-ice-white">Files</h2>
          {fileAnswers.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-steel-gray">
              <AlertTriangle size={12} /> No file answers attached.
            </div>
          ) : (
            <div className="space-y-2">
              {fileAnswers.map((item) => (
                <div
                  key={`${item.fieldId}:${item.file.url}`}
                  className="rounded-lg border border-[var(--ghost-border)] bg-midnight-light px-3 py-2"
                >
                  <p className="text-xs text-ice-white">{item.label}</p>
                  <p className="text-[11px] text-steel-gray">{item.file.filename}</p>
                  <p className="text-[11px] text-steel-gray">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <a
                    href={item.file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-signal-orange hover:underline"
                  >
                    <FileText size={12} /> Open file
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ice-white">Timeline</h2>
        {data.timeline.length === 0 ? (
          <p className="text-xs text-steel-gray">No timeline data.</p>
        ) : (
          <ul className="space-y-1">
            {data.timeline.map((item) => (
              <li key={item.key} className="text-xs text-steel-gray">
                <span className="text-ice-white">{item.label}</span> - {formatDateTime(item.timestamp)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

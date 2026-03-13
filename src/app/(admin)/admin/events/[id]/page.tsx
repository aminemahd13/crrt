import { prisma } from "@/lib/prisma";
import { toSelectOptions } from "@/lib/json";
import {
  parseSubmissionData,
  toDisplayRecordFromSubmission,
  type SubmissionFieldDescriptor,
} from "@/lib/form-submission";
import {
  encodeRegistrationApplicationId,
  encodeSubmissionApplicationId,
} from "@/lib/application-id";
import { notFound } from "next/navigation";
import type {
  RegistrationFieldConfig,
  VisibilityOperator,
  VisibilityRule,
} from "@/components/admin/events-admin-types";
import { EditEventClient } from "./edit-client";

function parseVisibilityRule(value: unknown): VisibilityRule | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (typeof item.sourceFieldId !== "string" || !item.sourceFieldId.trim()) {
    return null;
  }
  const operator =
    typeof item.operator === "string" && ["equals", "contains", "is_checked"].includes(item.operator)
      ? (item.operator as VisibilityOperator)
      : "equals";
  return {
    sourceFieldId: item.sourceFieldId,
    operator,
    value: typeof item.value === "string" ? item.value : "",
  };
}

function parseFieldConfig(value: unknown): RegistrationFieldConfig | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const item = value as Record<string, unknown>;
  const helperText = typeof item.helperText === "string" ? item.helperText : undefined;
  const fileValue =
    item.file && typeof item.file === "object" && !Array.isArray(item.file)
      ? (item.file as Record<string, unknown>)
      : null;
  const accept =
    fileValue && Array.isArray(fileValue.accept)
      ? fileValue.accept.map((entry) => String(entry).trim()).filter(Boolean)
      : undefined;
  const maxSizeBytes =
    fileValue && typeof fileValue.maxSizeBytes === "number" && Number.isFinite(fileValue.maxSizeBytes)
      ? Math.max(1, Math.floor(fileValue.maxSizeBytes))
      : undefined;

  const config: RegistrationFieldConfig = {};
  if (helperText) {
    config.helperText = helperText;
  }
  if (accept || maxSizeBytes) {
    config.file = {
      accept: accept ?? [],
      maxSizeBytes: maxSizeBytes ?? 10 * 1024 * 1024,
    };
  }
  return Object.keys(config).length > 0 ? config : undefined;
}

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const [event, form, registrations, orphanSubmissions] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
    }),
    prisma.form.findUnique({
      where: { eventId: id },
      include: {
        sections: { orderBy: { order: "asc" } },
        fields: { orderBy: { order: "asc" } },
      },
    }),
    prisma.eventRegistration.findMany({
      where: { eventId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        formSubmission: {
          select: {
            id: true,
            status: true,
            data: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.formSubmission.findMany({
      where: {
        form: { eventId: id },
        eventRegistrationId: null,
      },
      include: {
        form: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!event) return notFound();

  const fieldDescriptors: SubmissionFieldDescriptor[] = (form?.fields ?? []).map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    order: field.order,
  }));

  const registrationSections = (form?.sections ?? []).map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description ?? "",
    order: section.order,
    visibility: parseVisibilityRule(section.visibility),
  }));

  const registrationFields = (form?.fields ?? []).map((field) => ({
    id: field.id,
    sectionId: field.sectionId ?? undefined,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder ?? "",
    options: toSelectOptions(field.options).join(", "),
    order: field.order,
    visibility: parseVisibilityRule(field.visibility),
    config: parseFieldConfig(field.config),
  }));

  const registrationRows = registrations.map((registration) => {
    const submission = registration.formSubmission;
    const createdAt = submission?.createdAt ?? registration.createdAt;
    const updatedAt = submission?.updatedAt ?? registration.updatedAt;
    const parsedSubmission = parseSubmissionData(submission?.data);

    return {
      id: encodeRegistrationApplicationId(registration.id),
      registrationId: registration.id,
      submissionId: submission?.id ?? null,
      eventId: event.id,
      eventTitle: event.title,
      eventSlug: event.slug,
      userId: registration.userId,
      userName: registration.user.name,
      userEmail: registration.user.email,
      registrationStatus: registration.status,
      reviewStatus: submission?.status
        ? (submission.status as "new" | "in_review" | "accepted" | "rejected")
        : null,
      note: registration.note,
      submissionData: toDisplayRecordFromSubmission(submission?.data, fieldDescriptors),
      structuredSubmissionData:
        submission && parsedSubmission.schemaVersion >= 2
          ? {
              schemaVersion: parsedSubmission.schemaVersion,
              answers: parsedSubmission.answers,
              legacy: { unmapped: parsedSubmission.legacyUnmapped },
            }
          : undefined,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };
  });

  const orphanRows = orphanSubmissions.flatMap((submission) => {
    const linkedEvent = submission.form.event;
    if (!linkedEvent) return [];
    const parsedSubmission = parseSubmissionData(submission.data);

    return [
      {
        id: encodeSubmissionApplicationId(submission.id),
        registrationId: null,
        submissionId: submission.id,
        eventId: linkedEvent.id,
        eventTitle: linkedEvent.title,
        eventSlug: linkedEvent.slug,
        userId: "",
        userName: null,
        userEmail: null,
        registrationStatus: null,
        reviewStatus: submission.status as "new" | "in_review" | "accepted" | "rejected",
        note: null,
        submissionData: toDisplayRecordFromSubmission(submission.data, fieldDescriptors),
        structuredSubmissionData:
          parsedSubmission.schemaVersion >= 2
            ? {
                schemaVersion: parsedSubmission.schemaVersion,
                answers: parsedSubmission.answers,
                legacy: { unmapped: parsedSubmission.legacyUnmapped },
              }
            : undefined,
        createdAt: submission.createdAt.toISOString(),
        updatedAt: submission.updatedAt.toISOString(),
      },
    ];
  });

  return (
    <EditEventClient
      event={{
        ...event,
        startDate: event.startDate.toISOString().slice(0, 16),
        endDate: event.endDate?.toISOString().slice(0, 16) ?? "",
        publishStart: event.publishStart?.toISOString().slice(0, 16) ?? "",
        publishEnd: event.publishEnd?.toISOString().slice(0, 16) ?? "",
      }}
      initialRegistrationSections={registrationSections}
      initialRegistrationFields={registrationFields}
      initialApplications={[...registrationRows, ...orphanRows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )}
      initialTab={tab}
    />
  );
}

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDisplayRecordFromSubmission, updateSubmissionFromDisplayPatch } from "@/lib/form-submission";
import { logError, logInfo } from "@/lib/logger";
import {
  recordApiError,
  recordApiRequest,
  recordApplicationAction,
  recordApplicationFailure,
} from "@/lib/metrics";

const ALLOWED_STATUSES = new Set(["new", "in_review", "accepted", "rejected"] as const);

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/submissions/[id]", "PUT");

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      status?: unknown;
      data?: unknown;
    };

    const status = typeof body.status === "string" ? body.status : undefined;
    if (status && !ALLOWED_STATUSES.has(status as "new" | "in_review" | "accepted" | "rejected")) {
      return NextResponse.json({ error: "Invalid submission status" }, { status: 400 });
    }

    const patchData = body.data;
    if (patchData !== undefined && (!patchData || typeof patchData !== "object" || Array.isArray(patchData))) {
      return NextResponse.json({ error: "Payload data must be an object" }, { status: 400 });
    }

    if (!status && patchData === undefined) {
      return NextResponse.json(
        { error: "Provide at least one field to update (status or data)." },
        { status: 400 }
      );
    }

    const existing = await prisma.formSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        data: true,
        schemaVersion: true,
        eventRegistrationId: true,
        form: {
          select: {
            fields: {
              select: { id: true, label: true, type: true, order: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const submissionFields = existing.form?.fields ?? [];
    let nextData: Record<string, string> | null = null;
    let nextStructuredData: Prisma.InputJsonObject | null = null;
    if (patchData !== undefined) {
      const incoming = patchData as Record<string, unknown>;
      try {
        const structured = updateSubmissionFromDisplayPatch(
          existing.data,
          submissionFields,
          incoming
        );
        nextStructuredData = JSON.parse(JSON.stringify(structured)) as Prisma.InputJsonObject;
        nextData = toDisplayRecordFromSubmission(structured, submissionFields);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Failed to update payload." },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.formSubmission.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(nextStructuredData ? { data: nextStructuredData, schemaVersion: 2 } : {}),
      },
    });

    const session = await getServerSession(authOptions);
    recordApplicationAction("submission_update");
    logInfo("admin_submission_updated", {
      pathname: "/api/admin/submissions/[id]",
      method: "PUT",
      status: 200,
      requestId,
      details: {
        submissionId: id,
        actorId: session?.user?.id ?? null,
        actorEmail: session?.user?.email ?? null,
        beforeStatus: existing.status,
        afterStatus: updated.status,
        updatedDataKeys: nextData ? Object.keys(nextData) : [],
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      data: toDisplayRecordFromSubmission(updated.data, submissionFields),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      eventRegistrationId: updated.eventRegistrationId,
    });
  } catch (error) {
    recordApiError("/api/admin/submissions/[id]", "PUT");
    recordApplicationFailure("submission_update");
    logError("admin_submission_update_failed", {
      pathname: "/api/admin/submissions/[id]",
      method: "PUT",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = request.headers.get("x-request-id");
  recordApiRequest("/api/admin/submissions/[id]", "DELETE");

  try {
    const { id } = await params;
    const existing = await prisma.formSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        eventRegistrationId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({
        ok: true,
        deleted: {
          submissionId: null,
          registrationId: null,
        },
      });
    }

    const deleted = await prisma.$transaction(async (tx) => {
      await tx.formSubmission.delete({ where: { id } });

      let deletedRegistrationId: string | null = null;
      if (existing.eventRegistrationId) {
        const result = await tx.eventRegistration.deleteMany({
          where: { id: existing.eventRegistrationId },
        });
        if (result.count > 0) {
          deletedRegistrationId = existing.eventRegistrationId;
        }
      }

      return {
        deletedSubmissionId: id,
        deletedRegistrationId,
      };
    });

    const session = await getServerSession(authOptions);
    recordApplicationAction("submission_delete");
    logInfo("admin_submission_deleted", {
      pathname: "/api/admin/submissions/[id]",
      method: "DELETE",
      status: 200,
      requestId,
      details: {
        submissionId: deleted.deletedSubmissionId,
        registrationId: deleted.deletedRegistrationId,
        actorId: session?.user?.id ?? null,
        actorEmail: session?.user?.email ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      deleted: {
        submissionId: deleted.deletedSubmissionId,
        registrationId: deleted.deletedRegistrationId,
      },
    });
  } catch (error) {
    recordApiError("/api/admin/submissions/[id]", "DELETE");
    recordApplicationFailure("submission_delete");
    logError("admin_submission_delete_failed", {
      pathname: "/api/admin/submissions/[id]",
      method: "DELETE",
      status: 500,
      requestId,
      details: { message: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}

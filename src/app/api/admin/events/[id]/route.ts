import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EventPayloadValidationError, normalizeEventPayload } from "@/lib/event-payload";

interface FieldInput {
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: unknown;
}

function normalizeFieldOptions(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
    return Prisma.JsonNull;
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const normalized = normalizeEventPayload(body);
        const registrationFields: FieldInput[] = Array.isArray(body.registrationFields)
            ? body.registrationFields
            : [];

        const event = await prisma.event.update({
            where: { id },
            data: normalized,
        });

        // Sync linked registration form
        const existingForm = await prisma.form.findUnique({ where: { eventId: id } });

        if (normalized.registrationMode === "internal" && registrationFields.length > 0) {
            if (existingForm) {
                // Update existing form: replace fields
                await prisma.form.update({
                    where: { id: existingForm.id },
                    data: {
                        title: `Registration: ${normalized.title}`,
                        status: normalized.published ? "published" : "draft",
                    },
                });
                await prisma.formField.deleteMany({ where: { formId: existingForm.id } });
                for (let i = 0; i < registrationFields.length; i++) {
                    const f = registrationFields[i];
                    await prisma.formField.create({
                        data: {
                            formId: existingForm.id,
                            label: f.label,
                            type: f.type,
                            required: f.required ?? false,
                            placeholder: f.placeholder ?? null,
                            options: normalizeFieldOptions(f.options),
                            order: i,
                        },
                    });
                }
            } else {
                // Create new form
                const formSlug = `event-${normalized.slug}-${crypto.randomUUID().slice(0, 8)}`;
                await prisma.form.create({
                    data: {
                        title: `Registration: ${normalized.title}`,
                        slug: formSlug,
                        status: normalized.published ? "published" : "draft",
                        eventId: id,
                        fields: {
                            create: registrationFields.map((f, i) => ({
                                label: f.label,
                                type: f.type,
                                required: f.required ?? false,
                                placeholder: f.placeholder ?? null,
                                options: normalizeFieldOptions(f.options),
                                order: i,
                            })),
                        },
                    },
                });
            }
        }

        return NextResponse.json(event);
    } catch (error) {
        if (error instanceof EventPayloadValidationError) {
            return NextResponse.json(
                { error: "Validation failed", issues: error.issues },
                { status: 400 }
            );
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return NextResponse.json(
                    { error: "An event with this slug already exists." },
                    { status: 409 }
                );
            }

            if (error.code === "P2025") {
                return NextResponse.json({ error: "Event not found." }, { status: 404 });
            }
        }

        return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}

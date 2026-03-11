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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const normalized = normalizeEventPayload(body);
        const registrationFields: FieldInput[] = Array.isArray(body.registrationFields)
            ? body.registrationFields
            : [];

        const event = await prisma.event.create({
            data: normalized,
        });

        // Create linked registration form when internal mode + fields provided
        if (normalized.registrationMode === "internal" && registrationFields.length > 0) {
            const formSlug = `event-${normalized.slug}-${crypto.randomUUID().slice(0, 8)}`;
            await prisma.form.create({
                data: {
                    title: `Registration: ${normalized.title}`,
                    slug: formSlug,
                    status: normalized.published ? "published" : "draft",
                    eventId: event.id,
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

        return NextResponse.json(event, { status: 201 });
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
        }

        return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
    }
}

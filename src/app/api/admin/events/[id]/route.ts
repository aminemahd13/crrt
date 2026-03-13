import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EventPayloadValidationError, normalizeEventPayload } from "@/lib/event-payload";
import {
    normalizeRegistrationFields,
    normalizeRegistrationSections,
} from "@/lib/admin-form-builder";

async function syncFormBuilder(
    formId: string,
    sectionsInput: ReturnType<typeof normalizeRegistrationSections>,
    fieldsInput: ReturnType<typeof normalizeRegistrationFields>
) {
    await prisma.formField.deleteMany({ where: { formId } });
    await prisma.formSection.deleteMany({ where: { formId } });

    const sectionsToCreate =
        sectionsInput.length > 0
            ? sectionsInput
            : [
                  {
                      title: "Application",
                      description: null,
                      order: 0,
                      visibility: Prisma.JsonNull,
                  },
              ];

    const createdSections: Array<{ id: string; sourceId?: string }> = [];
    for (let i = 0; i < sectionsToCreate.length; i++) {
        const section = sectionsToCreate[i];
        const created = await prisma.formSection.create({
            data: {
                ...(section.id ? { id: section.id } : {}),
                formId,
                title: section.title,
                description: section.description,
                order: i,
                visibility: section.visibility,
            },
            select: { id: true },
        });
        createdSections.push({ id: created.id, sourceId: section.id });
    }

    const sourceToCreated = new Map<string, string>();
    for (const section of createdSections) {
        if (section.sourceId) {
            sourceToCreated.set(section.sourceId, section.id);
        }
    }
    const fallbackSectionId = createdSections[0]?.id;

    for (let i = 0; i < fieldsInput.length; i++) {
        const field = fieldsInput[i];
        await prisma.formField.create({
            data: {
                ...(field.id ? { id: field.id } : {}),
                formId,
                sectionId:
                    (field.sectionId ? sourceToCreated.get(field.sectionId) : undefined) ??
                    fallbackSectionId,
                label: field.label,
                type: field.type,
                required: field.required,
                placeholder: field.placeholder,
                options: field.options,
                visibility: field.visibility,
                config: field.config,
                order: i,
            },
        });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const normalized = normalizeEventPayload(body);
        const registrationSections = normalizeRegistrationSections(body.registrationSections);
        const registrationFields = normalizeRegistrationFields(body.registrationFields);

        const event = await prisma.event.update({
            where: { id },
            data: normalized,
        });

        // Sync linked registration form
        const existingForm = await prisma.form.findUnique({ where: { eventId: id } });

        if (normalized.registrationMode === "internal" && registrationFields.length > 0) {
            if (existingForm) {
                await prisma.form.update({
                    where: { id: existingForm.id },
                    data: {
                        title: `Registration: ${normalized.title}`,
                        status: normalized.published ? "published" : "draft",
                    },
                });
                await syncFormBuilder(existingForm.id, registrationSections, registrationFields);
            } else {
                const formSlug = `event-${normalized.slug}-${crypto.randomUUID().slice(0, 8)}`;
                const createdForm = await prisma.form.create({
                    data: {
                        title: `Registration: ${normalized.title}`,
                        slug: formSlug,
                        status: normalized.published ? "published" : "draft",
                        eventId: id,
                    },
                    select: { id: true },
                });
                await syncFormBuilder(createdForm.id, registrationSections, registrationFields);
            }
        } else if (existingForm) {
            await prisma.form.delete({ where: { id: existingForm.id } });
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

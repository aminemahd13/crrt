import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EventPayloadValidationError, normalizeEventPayload } from "@/lib/event-payload";
import {
    normalizeRegistrationFields,
    normalizeRegistrationSections,
} from "@/lib/admin-form-builder";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const normalized = normalizeEventPayload(body);
        const registrationSections = normalizeRegistrationSections(body.registrationSections);
        const registrationFields = normalizeRegistrationFields(body.registrationFields);

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
                    sections: {
                        create: (registrationSections.length > 0
                            ? registrationSections
                            : [
                                  {
                                      title: "Application",
                                      description: null,
                                      order: 0,
                                      visibility: Prisma.JsonNull,
                                  },
                              ]).map((section, index) => ({
                            title: section.title,
                            description: section.description,
                            order: index,
                            visibility: section.visibility,
                        })),
                    },
                },
            });

            const createdForm = await prisma.form.findUniqueOrThrow({
                where: { eventId: event.id },
                include: { sections: { orderBy: { order: "asc" } } },
            });
            const sectionIds = createdForm.sections.map((section) => section.id);
            const fallbackSectionId = sectionIds[0];
            const sectionMap = new Map<string, string>();
            registrationSections.forEach((section, index) => {
                if (section.id && sectionIds[index]) {
                    sectionMap.set(section.id, sectionIds[index]);
                }
            });

            await prisma.formField.createMany({
                data: registrationFields.map((field, index) => ({
                    formId: createdForm.id,
                    sectionId:
                        (field.sectionId ? sectionMap.get(field.sectionId) : undefined) ??
                        sectionIds[index % Math.max(sectionIds.length, 1)] ??
                        fallbackSectionId,
                    label: field.label,
                    type: field.type,
                    required: field.required,
                    placeholder: field.placeholder,
                    options: field.options,
                    visibility: field.visibility,
                    config: field.config,
                    order: index,
                })),
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

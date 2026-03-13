import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EventPayloadValidationError, normalizeEventPayload } from "@/lib/event-payload";
import {
    normalizeRegistrationFields,
    normalizeRegistrationSections,
} from "@/lib/admin-form-builder";

interface ParsedEventPartner {
    name: string;
    logoUrl: string;
    website: string | null;
}

function normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function parseEventPartners(value: unknown): { partners: ParsedEventPartner[]; error: string | null } {
    if (value === undefined || value === null) {
        return { partners: [], error: null };
    }

    if (!Array.isArray(value)) {
        return { partners: [], error: "Invalid event partners payload." };
    }

    const partners: ParsedEventPartner[] = [];
    for (const [index, item] of value.entries()) {
        if (!item || typeof item !== "object") continue;
        const row = item as Record<string, unknown>;
        const name = normalizeText(row.name);
        const logoUrl = normalizeText(row.logoUrl);
        const website = normalizeText(row.website);
        const hasAnyValue = Boolean(name || logoUrl || website);

        if (!hasAnyValue) continue;
        if (!name || !logoUrl) {
            return {
                partners: [],
                error: `Event partner #${index + 1} requires name and logo URL.`,
            };
        }

        partners.push({
            name,
            logoUrl,
            website: website || null,
        });
    }

    return { partners, error: null };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const normalized = normalizeEventPayload(body);
        const registrationSections = normalizeRegistrationSections(body.registrationSections);
        const registrationFields = normalizeRegistrationFields(body.registrationFields);
        const { partners: eventPartners, error: eventPartnersError } = parseEventPartners(body.eventPartners);

        if (eventPartnersError) {
            return NextResponse.json({ error: eventPartnersError }, { status: 400 });
        }

        const event = await prisma.event.create({
            data: normalized,
        });

        if (eventPartners.length > 0) {
            await (prisma as any).eventPartner.createMany({
                data: eventPartners.map((partner, index) => ({
                    eventId: event.id,
                    name: partner.name,
                    logoUrl: partner.logoUrl,
                    website: partner.website,
                    order: index,
                })),
            });
        }

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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    // Check if form is being published — if so, bump version
    const existing = await prisma.form.findUnique({ where: { id } });
    const isPublishing = existing && existing.status !== "published" && body.status === "published";

    // Update form metadata
    await prisma.form.update({
        where: { id },
        data: {
            title: body.title,
            slug: body.slug,
            description: body.description,
            status: body.status,
            emailTemplateId: body.emailTemplateId ?? null,
            spamProtection: body.spamProtection ?? false,
            // Increment version when publishing (immutable once published)
            ...(isPublishing ? { version: (existing?.version ?? 0) + 1 } : {}),
        },
    });

    // Replace fields: delete all then recreate
    await prisma.formField.deleteMany({ where: { formId: id } });

    if (body.fields && body.fields.length > 0) {
        for (let i = 0; i < body.fields.length; i++) {
            const f = body.fields[i];
            await prisma.formField.create({
                data: {
                    formId: id,
                    label: f.label,
                    type: f.type,
                    required: f.required ?? false,
                    placeholder: f.placeholder || null,
                    options: f.options || null,
                    validation: f.validation || null,
                    order: i,
                },
            });
        }
    }

    const updated = await prisma.form.findUnique({
        where: { id },
        include: { fields: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json(updated);
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await prisma.formField.deleteMany({ where: { formId: id } });
    await prisma.formSubmission.deleteMany({ where: { formId: id } });
    await prisma.form.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}

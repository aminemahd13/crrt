import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    // Update form metadata
    await prisma.form.update({
        where: { id },
        data: {
            title: body.title,
            slug: body.slug,
            status: body.status,
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
                    order: i,
                },
            });
        }
    }

    return NextResponse.json({ ok: true });
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

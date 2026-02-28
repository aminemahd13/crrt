import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    const event = await prisma.event.update({
        where: { id },
        data: {
            title: body.title,
            slug: body.slug,
            description: body.description,
            content: body.content,
            type: body.type,
            startDate: new Date(body.startDate),
            endDate: body.endDate ? new Date(body.endDate) : null,
            location: body.location || null,
            capacity: body.capacity || null,
            coverImage: body.coverImage || null,
            published: body.published ?? false,
        },
    });

    return NextResponse.json(event);
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}

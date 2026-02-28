import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    const post = await prisma.post.update({
        where: { id },
        data: {
            title: body.title,
            slug: body.slug,
            excerpt: body.excerpt || null,
            content: body.content,
            coverImage: body.coverImage || null,
            published: body.published ?? false,
        },
    });

    return NextResponse.json(post);
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}

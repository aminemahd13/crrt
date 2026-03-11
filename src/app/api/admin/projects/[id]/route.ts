import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    const project = await prisma.project.update({
        where: { id },
        data: {
            title: body.title,
            slug: body.slug,
            description: body.description,
            content: body.content,
            status: body.status,
            stackTags: typeof body.stackTags === "string"
                ? body.stackTags.split(",").map((s: string) => s.trim()).filter(Boolean)
                : Array.isArray(body.stackTags)
                    ? body.stackTags
                    : [],
            year: body.year || null,
            repoUrl: body.repoUrl || null,
            demoUrl: body.demoUrl || null,
            coverImage: body.coverImage || null,
            published: body.published ?? false,
        },
    });

    return NextResponse.json(project);
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}

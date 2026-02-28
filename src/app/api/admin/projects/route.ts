import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const body = await request.json();

    const project = await prisma.project.create({
        data: {
            title: body.title,
            slug: body.slug,
            description: body.description ?? "",
            content: body.content ?? "",
            status: body.status ?? "ongoing",
            stackTags: typeof body.stackTags === "string"
                ? JSON.stringify(body.stackTags.split(",").map((s: string) => s.trim()).filter(Boolean))
                : JSON.stringify(body.stackTags ?? []),
            year: body.year ?? null,
            repoUrl: body.repoUrl ?? null,
            demoUrl: body.demoUrl ?? null,
            coverImage: body.coverImage ?? null,
            published: body.published ?? false,
        },
    });

    return NextResponse.json(project, { status: 201 });
}

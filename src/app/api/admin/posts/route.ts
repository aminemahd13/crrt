import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const body = await request.json();

    const post = await prisma.post.create({
        data: {
            title: body.title,
            slug: body.slug,
            excerpt: body.excerpt ?? null,
            content: body.content ?? "",
            coverImage: body.coverImage ?? null,
            published: body.published ?? false,
        },
    });

    return NextResponse.json(post, { status: 201 });
}

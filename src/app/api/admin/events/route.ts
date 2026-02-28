import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const body = await request.json();

    const event = await prisma.event.create({
        data: {
            title: body.title,
            slug: body.slug,
            description: body.description ?? "",
            content: body.content ?? "",
            type: body.type ?? "training",
            startDate: new Date(body.startDate),
            endDate: body.endDate ? new Date(body.endDate) : null,
            location: body.location ?? null,
            capacity: body.capacity ?? null,
            coverImage: body.coverImage ?? null,
            published: body.published ?? false,
        },
    });

    return NextResponse.json(event, { status: 201 });
}

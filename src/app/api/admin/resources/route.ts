import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const resource = await prisma.resource.create({
            data: {
                title: data.title,
                slug: data.slug,
                description: data.description,
                url: data.url,
                type: data.type,
                isPublic: data.isPublic,
                categoryId: data.categoryId,
            },
        });
        return NextResponse.json({ success: true, resource });
    } catch (error) {
        console.error("Failed to create resource:", error);
        return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
    }
}

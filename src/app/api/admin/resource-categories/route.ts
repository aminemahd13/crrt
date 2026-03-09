import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const category = await prisma.resourceCategory.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                color: data.color,
                icon: data.icon,
            },
        });
        return NextResponse.json({ success: true, category });
    } catch (error) {
        console.error("Failed to create category:", error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
}

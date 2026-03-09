import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.resource.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting resource:", error);
        return NextResponse.json(
            { error: "Failed to delete resource" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();
        const resource = await prisma.resource.update({
            where: { id },
            data: {
                title: data.title,
                slug: data.slug,
                description: data.description,
                url: data.url,
                type: data.type,
                isPublic: data.isPublic,
                categoryId: data.categoryId,
            }
        });
        return NextResponse.json({ success: true, resource });
    } catch (error) {
        console.error("Error updating resource:", error);
        return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
    }
}

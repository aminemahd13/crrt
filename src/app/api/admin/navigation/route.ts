import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
    const { items } = await request.json();

    // Delete all existing nav items and recreate
    await prisma.navItem.deleteMany();

    for (const item of items) {
        await prisma.navItem.create({
            data: {
                label: item.label,
                href: item.href,
                order: item.order,
                visible: item.visible,
                section: item.section,
            },
        });
    }

    return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
    const body = await request.json();

    const config = await prisma.homeConfig.upsert({
        where: { id: "default" },
        update: {
            missionText: body.missionText,
            tagline: body.tagline,
            pinnedEventId: body.pinnedEventId,
            featuredProjectIds: JSON.stringify(body.featuredProjectIds ?? []),
            trackTagMap: JSON.stringify(body.trackTagMap ?? []),
        },
        create: {
            id: "default",
            missionText: body.missionText,
            tagline: body.tagline,
            pinnedEventId: body.pinnedEventId,
            featuredProjectIds: JSON.stringify(body.featuredProjectIds ?? []),
            trackTagMap: JSON.stringify(body.trackTagMap ?? []),
        },
    });

    return NextResponse.json(config);
}

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
            featuredProjectIds: body.featuredProjectIds ?? [],
            trackTagMap: body.trackTagMap ?? [],
        },
        create: {
            id: "default",
            missionText: body.missionText,
            tagline: body.tagline,
            pinnedEventId: body.pinnedEventId,
            featuredProjectIds: body.featuredProjectIds ?? [],
            trackTagMap: body.trackTagMap ?? [],
        },
    });

    return NextResponse.json(config);
}

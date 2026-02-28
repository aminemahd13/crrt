import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
    const body = await request.json();

    const theme = await prisma.themeSettings.upsert({
        where: { id: "default" },
        update: {
            primaryColor: body.primaryColor,
            backgroundColor: body.backgroundColor,
            accentColor: body.accentColor ?? body.primaryColor,
            radius: body.radius,
            shadowStrength: body.shadowStrength,
            glassIntensity: body.glassIntensity,
            noiseOverlay: body.noiseOverlay,
            motionLevel: body.motionLevel,
            heroVariant: body.heroVariant,
            cardVariant: body.cardVariant,
            timelineVariant: body.timelineVariant,
        },
        create: {
            id: "default",
            primaryColor: body.primaryColor,
            backgroundColor: body.backgroundColor,
            accentColor: body.accentColor ?? body.primaryColor,
            radius: body.radius,
            shadowStrength: body.shadowStrength,
            glassIntensity: body.glassIntensity,
            noiseOverlay: body.noiseOverlay,
            motionLevel: body.motionLevel,
            heroVariant: body.heroVariant,
            cardVariant: body.cardVariant,
            timelineVariant: body.timelineVariant,
        },
    });

    return NextResponse.json(theme);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const theme = await prisma.themeSettings.findUnique({
        where: { id: "default" },
    });

    if (!theme) {
        return NextResponse.json({
            primaryColor: "#F97316",
            backgroundColor: "#0F172A",
            accentColor: "#F97316",
            radius: 16,
            shadowStrength: "medium",
            glassIntensity: "medium",
            noiseOverlay: "subtle",
            motionLevel: "standard",
            heroVariant: "A",
            cardVariant: "elevated",
            timelineVariant: "blueprint",
        });
    }

    return NextResponse.json(theme);
}

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
            logoLight: body.logoLight,
            logoDark: body.logoDark,
            favicon: body.favicon,
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
            logoLight: body.logoLight,
            logoDark: body.logoDark,
            favicon: body.favicon,
        },
    });

    return NextResponse.json(theme);
}

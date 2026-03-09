import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EventPayloadValidationError, normalizeEventPayload } from "@/lib/event-payload";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const normalized = normalizeEventPayload(body);

        const event = await prisma.event.create({
            data: normalized,
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        if (error instanceof EventPayloadValidationError) {
            return NextResponse.json(
                { error: "Validation failed", issues: error.issues },
                { status: 400 }
            );
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return NextResponse.json(
                    { error: "An event with this slug already exists." },
                    { status: 409 }
                );
            }
        }

        return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
    }
}

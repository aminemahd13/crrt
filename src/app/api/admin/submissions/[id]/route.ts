import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { status } = await request.json();

    const submission = await prisma.formSubmission.update({
        where: { id },
        data: { status },
    });

    return NextResponse.json(submission);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const { formId, data } = await request.json();

    if (!formId || !data) {
        return NextResponse.json({ error: "Missing formId or data" }, { status: 400 });
    }

    // Verify form exists and is published
    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form || form.status !== "published") {
        return NextResponse.json({ error: "Form not found or not published" }, { status: 404 });
    }

    const submission = await prisma.formSubmission.create({
        data: {
            formId,
            data: JSON.stringify(data),
            status: "new",
        },
    });

    return NextResponse.json(submission, { status: 201 });
}

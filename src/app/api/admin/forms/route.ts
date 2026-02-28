import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const body = await request.json();

    const form = await prisma.form.create({
        data: {
            title: body.title,
            slug: body.slug ?? body.title.toLowerCase().replace(/\s+/g, "-"),
            status: body.status ?? "draft",
            version: 1,
            fields: {
                create: (body.fields ?? []).map(
                    (f: { label: string; type: string; required?: boolean; placeholder?: string; options?: string }, i: number) => ({
                        label: f.label,
                        type: f.type,
                        required: f.required ?? false,
                        placeholder: f.placeholder ?? null,
                        options: f.options ?? null,
                        order: i,
                    })
                ),
            },
        },
    });

    return NextResponse.json(form, { status: 201 });
}

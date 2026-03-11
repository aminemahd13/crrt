import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function normalizeFieldOptions(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return Prisma.JsonNull;
}

export async function POST(request: Request) {
    const body = await request.json();
    const baseSlug = (body.slug ?? body.title ?? "form")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    const slug = `${baseSlug || "form"}-${crypto.randomUUID().slice(0, 8)}`;

    const form = await prisma.form.create({
        data: {
            title: body.title,
            slug,
            status: body.status ?? "draft",
            version: 1,
            fields: {
                create: (body.fields ?? []).map(
                    (f: { label: string; type: string; required?: boolean; placeholder?: string; options?: unknown }, i: number) => ({
                        label: f.label,
                        type: f.type,
                        required: f.required ?? false,
                        placeholder: f.placeholder ?? null,
                        options: normalizeFieldOptions(f.options),
                        order: i,
                    })
                ),
            },
        },
    });

    return NextResponse.json(form, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueName = `${baseName}-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const media = await prisma.media.create({
        data: {
            filename: file.name,
            url: `/uploads/${uniqueName}`,
            mimeType: file.type,
            size: file.size,
            alt: formData.get("alt") as string || null,
            usedIn: formData.get("usedIn") as string || null,
        },
    });

    return NextResponse.json(media, { status: 201 });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), "public", media.url);
    try {
        const { unlink } = await import("fs/promises");
        await unlink(filePath);
    } catch {
        // File may not exist on disk, continue with DB cleanup
    }

    await prisma.media.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_UPLOAD_BYTES = Number.parseInt(process.env.MEDIA_MAX_UPLOAD_BYTES ?? `${10 * 1024 * 1024}`, 10);
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "application/pdf",
]);

function getUploadDir(): string {
    return process.env.MEDIA_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
}

function getSafeExt(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    if (!ext || ext.length > 10) {
        return ".bin";
    }
    return ext.replace(/[^a-z0-9.]/g, "");
}

export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: "File is too large" }, { status: 413 });
    }

    // Ensure uploads directory exists
    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = getSafeExt(file.name);
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
    const filePath = path.join(getUploadDir(), path.basename(media.url));
    try {
        const { unlink } = await import("fs/promises");
        await unlink(filePath);
    } catch {
        // File may not exist on disk, continue with DB cleanup
    }

    await prisma.media.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}

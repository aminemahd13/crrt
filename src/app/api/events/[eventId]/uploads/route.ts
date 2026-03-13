import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  APPLICATION_ALLOWED_MIME_TYPES,
  APPLICATION_MAX_UPLOAD_BYTES,
} from "@/lib/file-upload-policy";

function getUploadDir(): string {
  return process.env.MEDIA_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { eventId } = await params;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, registrationMode: true },
  });
  if (!event || event.registrationMode !== "internal") {
    return NextResponse.json({ error: "Uploads are unavailable for this event" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!APPLICATION_ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > APPLICATION_MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large" }, { status: 413 });
  }

  const uploadDir = path.join(getUploadDir(), "applications");
  await mkdir(uploadDir, { recursive: true });

  const ext = path.extname(file.name).toLowerCase();
  const basename = path.basename(file.name, ext);
  const uniqueName = `${safeFilename(basename)}-${Date.now()}${ext}`;
  const destination = path.join(uploadDir, uniqueName);

  const bytes = await file.arrayBuffer();
  await writeFile(destination, Buffer.from(bytes));

  const url = `/uploads/applications/${uniqueName}`;

  await prisma.media.create({
    data: {
      filename: file.name,
      url,
      mimeType: file.type,
      size: file.size,
      usedIn: `event:${eventId}:application`,
      alt: null,
    },
  });

  return NextResponse.json({
    url,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
  });
}

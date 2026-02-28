import { prisma } from "@/lib/prisma";
import { MediaStudioClient } from "./media-client";

export default async function MediaStudioPage() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <MediaStudioClient media={media} />;
}

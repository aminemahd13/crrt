import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface InputNavItem {
  label?: unknown;
  href?: unknown;
  order?: unknown;
  visible?: unknown;
  section?: unknown;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeItem(item: InputNavItem, fallbackOrder: number) {
  const label = normalizeString(item.label);
  const href = normalizeString(item.href);
  const section = normalizeString(item.section);

  if (!label || !href || !section) {
    return null;
  }

  const parsedOrder =
    typeof item.order === "number" && Number.isFinite(item.order)
      ? Math.max(0, Math.floor(item.order))
      : fallbackOrder;

  return {
    label,
    href,
    section,
    order: parsedOrder,
    visible: item.visible !== false,
  };
}

export async function PUT(request: Request) {
    const payload = await request.json().catch(() => null);
    const rawItems: unknown = payload && typeof payload === "object" ? (payload as { items?: unknown }).items : null;

    if (!Array.isArray(rawItems)) {
        return NextResponse.json({ error: "Invalid payload. Expected { items: [] }." }, { status: 400 });
    }

    const normalizedItems = rawItems
        .map((item, index) => normalizeItem((item ?? {}) as InputNavItem, index))
        .filter((item): item is NonNullable<ReturnType<typeof normalizeItem>> => item !== null);

    try {
        await prisma.$transaction(async (tx) => {
            await tx.navItem.deleteMany();
            if (normalizedItems.length > 0) {
                await tx.navItem.createMany({
                    data: normalizedItems,
                });
            }
        });
    } catch {
        return NextResponse.json({ error: "Failed to save navigation." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}

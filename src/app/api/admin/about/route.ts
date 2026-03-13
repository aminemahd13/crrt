import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ABOUT_CONFIG } from "@/lib/about-config";

interface ParsedMember {
  id: string | null;
  name: string;
  role: string;
  image: string | null;
  linkedIn: string | null;
  isAlumni: boolean;
}

interface ParsedMilestone {
  id: string | null;
  year: number;
  title: string;
  description: string | null;
}

interface ParsedConfig {
  heroTitle: string;
  storyText: string;
  teamCurrentLabel: string;
  teamAlumniLabel: string;
  timelineHeading: string;
  valueCards: Array<{ title: string; desc: string }>;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parsePersistedId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  if (!id) return null;
  if (id.startsWith("new-") || id.startsWith("member-") || id.startsWith("milestone-")) return null;
  return id;
}

function parseConfig(value: unknown): ParsedConfig {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const valueCardsSource = Array.isArray(source.valueCards) ? source.valueCards : [];
  const valueCards = valueCardsSource
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = normalizeText(row.title);
      const desc = normalizeText(row.desc);
      if (!title || !desc) return null;
      return { title, desc };
    })
    .filter((item): item is { title: string; desc: string } => item !== null);

  return {
    heroTitle: normalizeText(source.heroTitle) || DEFAULT_ABOUT_CONFIG.heroTitle,
    storyText: normalizeText(source.storyText) || DEFAULT_ABOUT_CONFIG.storyText,
    teamCurrentLabel:
      normalizeText(source.teamCurrentLabel) || DEFAULT_ABOUT_CONFIG.teamCurrentLabel,
    teamAlumniLabel:
      normalizeText(source.teamAlumniLabel) || DEFAULT_ABOUT_CONFIG.teamAlumniLabel,
    timelineHeading:
      normalizeText(source.timelineHeading) || DEFAULT_ABOUT_CONFIG.timelineHeading,
    valueCards: valueCards.length > 0 ? valueCards : DEFAULT_ABOUT_CONFIG.valueCards,
  };
}

function parseMembers(value: unknown): { members: ParsedMember[]; error: string | null } {
  if (!Array.isArray(value)) {
    return { members: [], error: "Invalid members payload." };
  }

  const members: ParsedMember[] = [];
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = normalizeText(row.name);
    const role = normalizeText(row.role);
    const image = normalizeText(row.image);
    const linkedIn = normalizeText(row.linkedIn);
    const isAlumni = row.isAlumni === true;

    const hasAnyField = Boolean(name || role || image || linkedIn || isAlumni);
    if (!hasAnyField) continue;
    if (!name || !role) {
      return { members: [], error: `Team member #${index + 1} requires name and role.` };
    }

    members.push({
      id: parsePersistedId(row.id),
      name,
      role,
      image: image || null,
      linkedIn: linkedIn || null,
      isAlumni,
    });
  }

  return { members, error: null };
}

function parseMilestones(value: unknown): { milestones: ParsedMilestone[]; error: string | null } {
  if (!Array.isArray(value)) {
    return { milestones: [], error: "Invalid milestones payload." };
  }

  const milestones: ParsedMilestone[] = [];
  for (const [index, item] of value.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const title = normalizeText(row.title);
    const description = normalizeText(row.description);
    const yearRaw = row.year;
    const yearAsText = normalizeText(yearRaw);
    const year =
      typeof yearRaw === "number" && Number.isFinite(yearRaw)
        ? Math.floor(yearRaw)
        : Number.parseInt(yearAsText, 10);

    const hasAnyField = Boolean(title || description || yearAsText);
    if (!hasAnyField) continue;
    if (!title || !Number.isFinite(year)) {
      return { milestones: [], error: `Milestone #${index + 1} requires year and title.` };
    }

    milestones.push({
      id: parsePersistedId(row.id),
      year,
      title,
      description: description || null,
    });
  }

  return { milestones, error: null };
}

export async function GET() {
  const [config, members, milestones] = await Promise.all([
    prisma.aboutConfig.findUnique({ where: { id: "default" } }),
    prisma.teamMember.findMany({ orderBy: { order: "asc" } }),
    prisma.timelineMilestone.findMany({ orderBy: { order: "asc" } }),
  ]);

  return NextResponse.json({
    config: {
      heroTitle: config?.heroTitle ?? DEFAULT_ABOUT_CONFIG.heroTitle,
      storyText: config?.storyText ?? DEFAULT_ABOUT_CONFIG.storyText,
      teamCurrentLabel: config?.teamCurrentLabel ?? DEFAULT_ABOUT_CONFIG.teamCurrentLabel,
      teamAlumniLabel: config?.teamAlumniLabel ?? DEFAULT_ABOUT_CONFIG.teamAlumniLabel,
      timelineHeading: config?.timelineHeading ?? DEFAULT_ABOUT_CONFIG.timelineHeading,
      valueCards: Array.isArray(config?.valueCards) ? config.valueCards : DEFAULT_ABOUT_CONFIG.valueCards,
    },
    members,
    milestones,
  });
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const parsedConfig = parseConfig(payload.config);
  const { members, error: membersError } = parseMembers(payload.members);
  if (membersError) {
    return NextResponse.json({ error: membersError }, { status: 400 });
  }

  const { milestones, error: milestonesError } = parseMilestones(payload.milestones);
  if (milestonesError) {
    return NextResponse.json({ error: milestonesError }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.aboutConfig.upsert({
      where: { id: "default" },
      update: parsedConfig,
      create: {
        id: "default",
        ...parsedConfig,
      },
    });

    const existingMembers = await tx.teamMember.findMany({ select: { id: true } });
    const existingMemberIds = new Set(existingMembers.map((member) => member.id));
    const retainedMemberIds = members
      .map((member) => member.id)
      .filter((id): id is string => Boolean(id && existingMemberIds.has(id)));

    if (retainedMemberIds.length > 0) {
      await tx.teamMember.deleteMany({
        where: {
          id: {
            notIn: retainedMemberIds,
          },
        },
      });
    } else {
      await tx.teamMember.deleteMany();
    }

    for (const [index, member] of members.entries()) {
      const data = {
        name: member.name,
        role: member.role,
        image: member.image,
        linkedIn: member.linkedIn,
        isAlumni: member.isAlumni,
        order: index,
      };

      if (member.id && existingMemberIds.has(member.id)) {
        await tx.teamMember.update({ where: { id: member.id }, data });
      } else {
        await tx.teamMember.create({ data });
      }
    }

    const existingMilestones = await tx.timelineMilestone.findMany({ select: { id: true } });
    const existingMilestoneIds = new Set(existingMilestones.map((milestone) => milestone.id));
    const retainedMilestoneIds = milestones
      .map((milestone) => milestone.id)
      .filter((id): id is string => Boolean(id && existingMilestoneIds.has(id)));

    if (retainedMilestoneIds.length > 0) {
      await tx.timelineMilestone.deleteMany({
        where: {
          id: {
            notIn: retainedMilestoneIds,
          },
        },
      });
    } else {
      await tx.timelineMilestone.deleteMany();
    }

    for (const [index, milestone] of milestones.entries()) {
      const data = {
        year: milestone.year,
        title: milestone.title,
        description: milestone.description,
        order: index,
      };
      if (milestone.id && existingMilestoneIds.has(milestone.id)) {
        await tx.timelineMilestone.update({ where: { id: milestone.id }, data });
      } else {
        await tx.timelineMilestone.create({ data });
      }
    }
  });

  return NextResponse.json({ ok: true });
}

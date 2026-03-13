-- CreateTable
CREATE TABLE "AboutConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "heroTitle" TEXT NOT NULL DEFAULT 'About CRRT',
    "storyText" TEXT NOT NULL DEFAULT 'The Club Robotique & Recherche Technologique (CRRT) is ENSA Agadir''s student-led engineering club, founded in 2008. We build robots, conduct research, and organize events that push the boundaries of what''s possible with technology.',
    "valueCards" JSONB NOT NULL DEFAULT '[]',
    "teamCurrentLabel" TEXT NOT NULL DEFAULT 'Current Bureau',
    "teamAlumniLabel" TEXT NOT NULL DEFAULT 'Alumni',
    "timelineHeading" TEXT NOT NULL DEFAULT 'Since 2008',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AboutConfig_pkey" PRIMARY KEY ("id")
);

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'workshop',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "coverImage" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "capacity" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSpeaker" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "bio" TEXT,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventSpeaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ongoing',
    "coverImage" TEXT,
    "repoUrl" TEXT,
    "demoUrl" TEXT,
    "stackTags" TEXT NOT NULL DEFAULT '[]',
    "year" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT,
    "authorId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "labelFr" TEXT,
    "labelAr" TEXT,
    "labelEn" TEXT,
    "color" TEXT,
    "icon" TEXT,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTag" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "eventId" TEXT,
    "projectId" TEXT,
    "postId" TEXT,

    CONSTRAINT "ContentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "alt" TEXT,
    "usedIn" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,

    CONSTRAINT "ResourceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'document',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "template" TEXT,
    "emailTemplateId" TEXT,
    "spamProtection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT,
    "validation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "page" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThemeSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "primaryColor" TEXT NOT NULL DEFAULT '#F97316',
    "backgroundColor" TEXT NOT NULL DEFAULT '#0F172A',
    "accentColor" TEXT NOT NULL DEFAULT '#F97316',
    "radius" INTEGER NOT NULL DEFAULT 16,
    "shadowStrength" TEXT NOT NULL DEFAULT 'medium',
    "glassIntensity" TEXT NOT NULL DEFAULT 'medium',
    "noiseOverlay" TEXT NOT NULL DEFAULT 'subtle',
    "motionLevel" TEXT NOT NULL DEFAULT 'standard',
    "heroVariant" TEXT NOT NULL DEFAULT 'A',
    "cardVariant" TEXT NOT NULL DEFAULT 'elevated',
    "timelineVariant" TEXT NOT NULL DEFAULT 'blueprint',
    "logoLight" TEXT,
    "logoDark" TEXT,
    "favicon" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "missionText" TEXT NOT NULL DEFAULT 'Club Robotique & Recherche Technologique',
    "tagline" TEXT NOT NULL DEFAULT 'Our robots never sleep.',
    "pinnedEventId" TEXT,
    "featuredProjectIds" TEXT NOT NULL DEFAULT '[]',
    "trackTagMap" TEXT NOT NULL DEFAULT '[]',
    "sponsorIds" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "section" TEXT NOT NULL DEFAULT 'main',

    CONSTRAINT "NavItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineMilestone" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TimelineMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "website" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "image" TEXT,
    "linkedIn" TEXT,
    "isAlumni" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCategory_name_key" ON "ResourceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceCategory_slug_key" ON "ResourceCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_slug_key" ON "Resource"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Form_slug_key" ON "Form"("slug");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTag" ADD CONSTRAINT "ContentTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ResourceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;


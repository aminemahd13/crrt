-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "publishEnd" TIMESTAMP(3),
ADD COLUMN     "publishStart" TIMESTAMP(3),
ADD COLUMN     "registrationLabel" TEXT,
ADD COLUMN     "registrationMode" TEXT NOT NULL DEFAULT 'internal',
ADD COLUMN     "registrationUrl" TEXT,
ADD COLUMN     "themeAccent" TEXT,
ADD COLUMN     "themePreset" TEXT NOT NULL DEFAULT 'default';


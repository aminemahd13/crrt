-- Phase 1: Add profile fields to User
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "organization" TEXT;
ALTER TABLE "User" ADD COLUMN "city" TEXT;

-- Phase 2: Remove editor role — convert existing editors to admin
UPDATE "User" SET "role" = 'admin' WHERE "role" = 'editor';

-- Phase 3: Add registrationReviewMode to Event
ALTER TABLE "Event" ADD COLUMN "registrationReviewMode" TEXT NOT NULL DEFAULT 'auto';

-- Phase 4: Bind Form to Event (optional one-to-one)
ALTER TABLE "Form" ADD COLUMN "eventId" TEXT;
ALTER TABLE "Form" ADD CONSTRAINT "Form_eventId_key" UNIQUE ("eventId");
ALTER TABLE "Form" ADD CONSTRAINT "Form_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Phase 5: Link FormSubmission to EventRegistration (optional one-to-one)
ALTER TABLE "FormSubmission" ADD COLUMN "eventRegistrationId" TEXT;
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_eventRegistrationId_key" UNIQUE ("eventRegistrationId");
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_eventRegistrationId_fkey" FOREIGN KEY ("eventRegistrationId") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

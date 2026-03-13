-- CreateTable
CREATE TABLE "FormSection" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visibility" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSection_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "FormField"
ADD COLUMN "sectionId" TEXT,
ADD COLUMN "visibility" JSONB,
ADD COLUMN "config" JSONB;

-- AlterTable
ALTER TABLE "FormSubmission"
ADD COLUMN "schemaVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "FormSection_formId_order_idx" ON "FormSection"("formId", "order");

-- CreateIndex
CREATE INDEX "FormField_formId_sectionId_order_idx" ON "FormField"("formId", "sectionId", "order");

-- AddForeignKey
ALTER TABLE "FormSection" ADD CONSTRAINT "FormSection_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

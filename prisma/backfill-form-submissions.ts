import { PrismaClient } from "@prisma/client";
import {
  migrateLegacySubmissionData,
  type SubmissionFieldDescriptor,
} from "../src/lib/form-submission";

const prisma = new PrismaClient();

async function ensureSectionsForForm(formId: string) {
  const [sections, fields] = await Promise.all([
    prisma.formSection.findMany({
      where: { formId },
      orderBy: { order: "asc" },
      select: { id: true, order: true },
    }),
    prisma.formField.findMany({
      where: { formId },
      orderBy: { order: "asc" },
      select: { id: true, sectionId: true },
    }),
  ]);

  let defaultSectionId = sections[0]?.id ?? null;
  if (!defaultSectionId) {
    const created = await prisma.formSection.create({
      data: {
        formId,
        title: "Application",
        description: "Default section",
        order: 0,
      },
      select: { id: true },
    });
    defaultSectionId = created.id;
  }

  for (const field of fields) {
    if (field.sectionId) continue;
    await prisma.formField.update({
      where: { id: field.id },
      data: { sectionId: defaultSectionId },
    });
  }
}

async function migrateSubmissionsForForm(formId: string) {
  const [fields, submissions] = await Promise.all([
    prisma.formField.findMany({
      where: { formId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        label: true,
        type: true,
        order: true,
      },
    }),
    prisma.formSubmission.findMany({
      where: { formId },
      select: {
        id: true,
        schemaVersion: true,
        data: true,
      },
    }),
  ]);

  const descriptors: SubmissionFieldDescriptor[] = fields.map((field) => ({
    id: field.id,
    label: field.label,
    type: field.type,
    order: field.order,
  }));

  for (const submission of submissions) {
    if (submission.schemaVersion >= 2) continue;
    const migrated = migrateLegacySubmissionData(submission.data, descriptors);
    await prisma.formSubmission.update({
      where: { id: submission.id },
      data: {
        schemaVersion: 2,
        data: migrated as unknown as object,
      },
    });
  }
}

async function main() {
  const forms = await prisma.form.findMany({
    select: { id: true },
  });

  for (const form of forms) {
    await ensureSectionsForForm(form.id);
    await migrateSubmissionsForForm(form.id);
  }

  console.log(`Backfill complete for ${forms.length} forms.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

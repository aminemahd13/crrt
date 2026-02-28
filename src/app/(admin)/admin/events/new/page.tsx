"use client";

import { ContentEditor } from "@/components/admin/content-editor";

const eventFields = [
  { key: "title", label: "Title", type: "text" as const, required: true },
  { key: "slug", label: "Slug", type: "text" as const, required: true, placeholder: "auto-generated-from-title" },
  { key: "description", label: "Description", type: "textarea" as const, required: true },
  { key: "content", label: "Content (Markdown)", type: "textarea" as const },
  { key: "type", label: "Type", type: "select" as const, required: true, options: [
    { value: "training", label: "Training" },
    { value: "conference", label: "Conference" },
    { value: "competition", label: "Competition" },
    { value: "workshop", label: "Workshop" },
  ]},
  { key: "startDate", label: "Start Date", type: "datetime" as const, required: true },
  { key: "endDate", label: "End Date", type: "datetime" as const },
  { key: "location", label: "Location", type: "text" as const, placeholder: "e.g. Amphi B, ENSA Agadir" },
  { key: "capacity", label: "Capacity", type: "number" as const },
  { key: "coverImage", label: "Cover Image URL", type: "text" as const },
];

export default function NewEventPage() {
  return (
    <ContentEditor
      mode="create"
      contentType="events"
      initialData={{ published: false, type: "training" }}
      fields={eventFields}
    />
  );
}

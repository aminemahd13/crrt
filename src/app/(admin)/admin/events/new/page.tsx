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
    { value: "hackathon", label: "Hackathon" },
  ]},
  { key: "startDate", label: "Start Date", type: "datetime" as const, required: true },
  { key: "endDate", label: "End Date", type: "datetime" as const },
  { key: "location", label: "Location", type: "text" as const, placeholder: "e.g. Amphi B, ENSA Agadir" },
  { key: "capacity", label: "Capacity", type: "number" as const },
  { key: "coverImage", label: "Cover Image URL", type: "text" as const },
  { key: "themePreset", label: "Theme Preset", type: "select" as const, required: true, options: [
    { value: "default", label: "Default (Orange)" },
    { value: "ocean", label: "Ocean (Blue)" },
    { value: "forest", label: "Forest (Green)" },
    { value: "sunset", label: "Sunset (Rose)" },
    { value: "slate", label: "Slate (Neutral)" },
  ]},
  { key: "themeAccent", label: "Theme Accent Override", type: "text" as const, placeholder: "Optional HEX color like #F97316" },
  { key: "registrationMode", label: "Registration Mode", type: "select" as const, required: true, options: [
    { value: "closed", label: "Closed" },
    { value: "internal", label: "Internal" },
    { value: "external", label: "External" },
  ]},
  { key: "registrationLabel", label: "Registration Button Label", type: "text" as const, placeholder: "Optional custom CTA label" },
  { key: "registrationUrl", label: "Registration URL", type: "text" as const, placeholder: "Required for external mode" },
  { key: "publishStart", label: "Publish Start", type: "datetime" as const },
  { key: "publishEnd", label: "Publish End", type: "datetime" as const },
];

export default function NewEventPage() {
  return (
    <ContentEditor
      mode="create"
      contentType="events"
      initialData={{ published: false, type: "training", themePreset: "default", registrationMode: "internal" }}
      fields={eventFields}
    />
  );
}

"use client";

import { ContentEditor } from "@/components/admin/content-editor";
import Link from "next/link";

const eventFields = [
  { key: "title", label: "Title", type: "text" as const, required: true },
  { key: "slug", label: "Slug", type: "text" as const, required: true },
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
  { key: "location", label: "Location", type: "text" as const },
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

export function EditEventClient({ event }: { event: Record<string, unknown> }) {
  const eventId = typeof event.id === "string" ? event.id : "";

  return (
    <>
      {eventId && (
        <div className="px-8 pt-6">
          <Link
            href={`/admin/events/${eventId}/registrations`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5"
          >
            Manage Registrations
          </Link>
        </div>
      )}
      <ContentEditor
        mode="edit"
        contentType="events"
        initialData={event}
        fields={eventFields}
      />
    </>
  );
}

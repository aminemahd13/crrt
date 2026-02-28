"use client";

import { ContentEditor } from "@/components/admin/content-editor";

const projectFields = [
  { key: "title", label: "Title", type: "text" as const, required: true },
  { key: "slug", label: "Slug", type: "text" as const, required: true },
  { key: "description", label: "Description", type: "textarea" as const, required: true },
  { key: "content", label: "Content (Markdown)", type: "textarea" as const },
  { key: "status", label: "Status", type: "select" as const, options: [
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
  ]},
  { key: "stackTags", label: "Stack Tags (comma-separated)", type: "tags" as const },
  { key: "year", label: "Year", type: "number" as const },
  { key: "repoUrl", label: "Repository URL", type: "text" as const },
  { key: "demoUrl", label: "Demo URL", type: "text" as const },
  { key: "coverImage", label: "Cover Image URL", type: "text" as const },
];

export function EditProjectClient({ project }: { project: Record<string, unknown> }) {
  return (
    <ContentEditor
      mode="edit"
      contentType="projects"
      initialData={project}
      fields={projectFields}
    />
  );
}

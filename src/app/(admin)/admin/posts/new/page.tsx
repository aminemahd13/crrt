"use client";

import { ContentEditor } from "@/components/admin/content-editor";

const postFields = [
  { key: "title", label: "Title", type: "text" as const, required: true },
  { key: "slug", label: "Slug", type: "text" as const, required: true },
  { key: "excerpt", label: "Excerpt", type: "textarea" as const },
  { key: "content", label: "Content (Markdown)", type: "textarea" as const, required: true },
  { key: "coverImage", label: "Cover Image URL", type: "text" as const },
];

export default function NewPostPage() {
  return (
    <ContentEditor
      mode="create"
      contentType="posts"
      initialData={{ published: false }}
      fields={postFields}
    />
  );
}

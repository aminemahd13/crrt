"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Resource, ResourceCategory } from "@prisma/client";

interface ResourceFormClientProps {
  resource: Resource | null;
  categories: ResourceCategory[];
}

export function ResourceFormClient({ resource, categories }: ResourceFormClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: resource?.title || "",
    slug: resource?.slug || "",
    description: resource?.description || "",
    url: resource?.url || "",
    type: resource?.type || "document",
    isPublic: resource ? resource.isPublic : true,
    categoryId: resource?.categoryId || (categories.length > 0 ? categories[0].id : ""),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      alert("Please select a category or create one first.");
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!resource;
      const url = isEdit ? `/api/admin/resources/${resource.id}` : `/api/admin/resources`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save");
      
      router.push("/admin/resources");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error saving resource");
    } finally {
      setSaving(false);
    }
  };

  const handleSlugify = () => {
    if (!formData.title) return;
    setFormData((prev) => ({
      ...prev,
      slug: prev.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/resources"
          className="p-2 rounded-lg text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">
            {resource ? "Edit Resource" : "Create Resource"}
          </h1>
          <p className="text-sm text-steel-gray mt-1">
            {resource ? "Update existing resource details" : "Add a new resource to the library"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg text-ice-white border-b border-[var(--ghost-border)] pb-2">
              Basic info
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-steel-gray">Title</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                onBlur={() => !formData.slug && handleSlugify()}
                className="w-full px-4 py-2 bg-midnight border border-[var(--ghost-border)] rounded-lg text-sm text-ice-white focus:border-signal-orange/50 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-steel-gray">Slug</label>
                <button type="button" onClick={handleSlugify} className="text-xs text-signal-orange hover:underline">
                  Auto-generate
                </button>
              </div>
              <input
                required
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 bg-midnight border border-[var(--ghost-border)] rounded-lg text-sm text-ice-white focus:border-signal-orange/50 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-steel-gray">Category</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 bg-midnight border border-[var(--ghost-border)] rounded-lg text-sm text-ice-white focus:border-signal-orange/50 focus:outline-none transition-colors"
              >
                {categories.length === 0 && <option value="">No categories available</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-steel-gray">Type</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 bg-midnight border border-[var(--ghost-border)] rounded-lg text-sm text-ice-white focus:border-signal-orange/50 focus:outline-none transition-colors"
              >
                <option value="document">Document (PDF, Guide)</option>
                <option value="video">Video (Tutorial)</option>
                <option value="link">Link (External Site)</option>
                <option value="repository">Repository (GitHub/GitLab)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg text-ice-white border-b border-[var(--ghost-border)] pb-2">
              Description & Link
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-steel-gray">Short Description</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-midnight border border-[var(--ghost-border)] rounded-lg text-sm text-ice-white focus:border-signal-orange/50 focus:outline-none transition-colors resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-steel-gray">URL / Link</label>
              <input
                required
                type="url"
                placeholder="https://..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-2 bg-midnight border border-[var(--ghost-border)] rounded-lg text-sm text-ice-white focus:border-signal-orange/50 focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-4 h-4 rounded border-[var(--ghost-border)] bg-midnight text-signal-orange focus:ring-signal-orange/30"
              />
              <label htmlFor="isPublic" className="text-sm text-ice-white cursor-pointer select-none">
                Visible to Public
                <span className="block text-xs text-steel-gray mt-0.5">
                  If unchecked, only logged-in members can see this resource.
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--ghost-border)] flex justify-end">
          <button
            type="submit"
            disabled={saving || categories.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-signal-orange text-white text-sm font-medium hover:bg-[var(--signal-orange-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {resource ? "Save Changes" : "Create Resource"}
          </button>
        </div>
      </form>
    </div>
  );
}

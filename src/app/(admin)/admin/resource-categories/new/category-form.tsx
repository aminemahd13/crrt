"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { ResourceCategory } from "@prisma/client";

interface CategoryFormClientProps {
  category: ResourceCategory | null;
}

export function CategoryFormClient({ category }: CategoryFormClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    color: category?.color || "",
    icon: category?.icon || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!category;
      const url = isEdit ? `/api/admin/resource-categories/${category.id}` : `/api/admin/resource-categories`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save");
      
      router.push("/admin/resource-categories");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error saving category");
    } finally {
      setSaving(false);
    }
  };

  const handleSlugify = () => {
    if (!formData.name) return;
    setFormData((prev) => ({
      ...prev,
      slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/resource-categories"
          className="p-2 rounded-lg text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">
            {category ? "Edit Category" : "Create Category"}
          </h1>
          <p className="text-sm text-steel-gray mt-1">
            {category ? "Update existing category details" : "Add a new category for resources"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-steel-gray">Category Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <label className="text-sm font-medium text-steel-gray">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-midnight border border-[var(--ghost-border)] rounded-lg text-sm text-ice-white focus:border-signal-orange/50 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--ghost-border)] flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-signal-orange text-white text-sm font-medium hover:bg-[var(--signal-orange-hover)] transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {category ? "Save Changes" : "Create Category"}
          </button>
        </div>
      </form>
    </div>
  );
}

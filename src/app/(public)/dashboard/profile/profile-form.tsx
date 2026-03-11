"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Check } from "lucide-react";

interface ProfileData {
  name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  organization: string | null;
  city: string | null;
}

export function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const [form, setForm] = useState({
    name: initialData.name ?? "",
    phone: initialData.phone ?? "",
    bio: initialData.bio ?? "",
    organization: initialData.organization ?? "",
    city: initialData.city ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
  };

  const fields = [
    { key: "name", label: "Full Name", type: "text", placeholder: "Your name" },
    { key: "phone", label: "Phone", type: "tel", placeholder: "+212 6XX XXX XXX" },
    { key: "organization", label: "Organization", type: "text", placeholder: "University, company, or club" },
    { key: "city", label: "City", type: "text", placeholder: "Your city" },
    { key: "bio", label: "Bio", type: "textarea", placeholder: "Tell us a bit about yourself..." },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-ice-white">Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-signal-orange text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
      </div>

      <motion.div
        className="glass-card p-6 space-y-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-steel-gray uppercase tracking-wider">Email</label>
          <input
            type="email"
            value={initialData.email ?? ""}
            disabled
            className="w-full px-3 py-2.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-steel-gray cursor-not-allowed"
          />
          <p className="text-[10px] text-steel-gray/60">Email cannot be changed.</p>
        </div>

        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-xs font-medium text-steel-gray uppercase tracking-wider">{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                value={form[field.key as keyof typeof form]}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray/40 focus:border-signal-orange/30 focus:outline-none resize-y"
              />
            ) : (
              <input
                type={field.type}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray/40 focus:border-signal-orange/30 focus:outline-none"
              />
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

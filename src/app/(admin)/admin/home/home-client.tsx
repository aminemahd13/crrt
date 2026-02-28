"use client";

import { useState } from "react";
import { Save, Check, RotateCcw, Plus, Trash2 } from "lucide-react";

interface Track {
  tag: string;
  label: string;
  icon: string;
}

interface HomeConfig {
  missionText: string;
  tagline: string;
  pinnedEventId: string | null;
  featuredProjectIds: string[];
  trackTagMap: Track[];
}

interface HomeStudioClientProps {
  config: HomeConfig;
  events: { id: string; title: string; slug: string }[];
  projects: { id: string; title: string; slug: string }[];
}

export function HomeStudioClient({ config, events, projects }: HomeStudioClientProps) {
  const [form, setForm] = useState<HomeConfig>({ ...config });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/home", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addTrack = () => {
    setForm((prev) => ({
      ...prev,
      trackTagMap: [...prev.trackTagMap, { tag: "", label: "", icon: "cpu" }],
    }));
  };

  const removeTrack = (i: number) => {
    setForm((prev) => ({
      ...prev,
      trackTagMap: prev.trackTagMap.filter((_, idx) => idx !== i),
    }));
  };

  const updateTrack = (i: number, key: keyof Track, value: string) => {
    setForm((prev) => ({
      ...prev,
      trackTagMap: prev.trackTagMap.map((t, idx) =>
        idx === i ? { ...t, [key]: value } : t
      ),
    }));
  };

  const toggleFeaturedProject = (id: string) => {
    setForm((prev) => ({
      ...prev,
      featuredProjectIds: prev.featuredProjectIds.includes(id)
        ? prev.featuredProjectIds.filter((p) => p !== id)
        : [...prev.featuredProjectIds, id],
    }));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Home Studio</h1>
          <p className="text-sm text-steel-gray mt-1">Configure the home page hero, tracks, and featured items.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setForm({ ...config })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-signal-orange text-white text-xs font-medium hover:bg-[var(--signal-orange-hover)] transition-colors disabled:opacity-50"
          >
            {saved ? <Check size={12} /> : <Save size={12} />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      {/* Hero Text */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-ice-white text-sm">Hero Content</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Mission Text</label>
            <input
              type="text"
              value={form.missionText}
              onChange={(e) => setForm((p) => ({ ...p, missionText: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
        </div>
      </div>

      {/* Next Event Source */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-ice-white text-sm">Next Event Source</h3>
        <select
          value={form.pinnedEventId ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, pinnedEventId: e.target.value || null }))}
          className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
        >
          <option value="">Auto (next upcoming)</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      {/* Tracks */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-ice-white text-sm">Tracks (Tag → Label)</h3>
          <button onClick={addTrack} className="inline-flex items-center gap-1 text-xs text-signal-orange hover:underline">
            <Plus size={12} /> Add Track
          </button>
        </div>
        <div className="space-y-2">
          {form.trackTagMap.map((track, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={track.tag}
                onChange={(e) => updateTrack(i, "tag", e.target.value)}
                placeholder="Tag slug"
                className="flex-1 px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
              />
              <input
                type="text"
                value={track.label}
                onChange={(e) => updateTrack(i, "label", e.target.value)}
                placeholder="Display label"
                className="flex-1 px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
              />
              <input
                type="text"
                value={track.icon}
                onChange={(e) => updateTrack(i, "icon", e.target.value)}
                placeholder="Icon"
                className="w-20 px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
              />
              <button onClick={() => removeTrack(i)} className="p-2 text-steel-gray hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Projects */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-ice-white text-sm">Featured Projects</h3>
        <div className="space-y-1">
          {projects.map((p) => (
            <label key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featuredProjectIds.includes(p.id)}
                onChange={() => toggleFeaturedProject(p.id)}
                className="accent-signal-orange"
              />
              <span className="text-sm text-ice-white">{p.title}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

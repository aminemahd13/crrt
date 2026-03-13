"use client";

import { useState } from "react";
import { Save, Check, Plus, Trash2, AlertCircle } from "lucide-react";
import type { AboutConfigSnapshot, AboutValueCard } from "@/lib/about-config";

interface AboutMember {
  id: string;
  name: string;
  role: string;
  image: string;
  linkedIn: string;
  isAlumni: boolean;
}

interface AboutMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
}

interface AboutStudioClientProps {
  config: AboutConfigSnapshot;
  members: AboutMember[];
  milestones: AboutMilestone[];
}

function createClientId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function AboutStudioClient({ config, members, milestones }: AboutStudioClientProps) {
  const [heroTitle, setHeroTitle] = useState(config.heroTitle);
  const [storyText, setStoryText] = useState(config.storyText);
  const [teamCurrentLabel, setTeamCurrentLabel] = useState(config.teamCurrentLabel);
  const [teamAlumniLabel, setTeamAlumniLabel] = useState(config.teamAlumniLabel);
  const [timelineHeading, setTimelineHeading] = useState(config.timelineHeading);
  const [valueCards, setValueCards] = useState<AboutValueCard[]>(config.valueCards);
  const [teamMembers, setTeamMembers] = useState<AboutMember[]>(members);
  const [timelineMilestones, setTimelineMilestones] = useState<AboutMilestone[]>(milestones);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addValueCard = () => {
    setValueCards((prev) => [...prev, { title: "", desc: "" }]);
    setSaved(false);
    setError(null);
  };

  const updateValueCard = (index: number, key: keyof AboutValueCard, value: string) => {
    setValueCards((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
    setSaved(false);
    setError(null);
  };

  const removeValueCard = (index: number) => {
    setValueCards((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
    setError(null);
  };

  const addMember = () => {
    setTeamMembers((prev) => [
      ...prev,
      {
        id: createClientId("member"),
        name: "",
        role: "",
        image: "",
        linkedIn: "",
        isAlumni: false,
      },
    ]);
    setSaved(false);
    setError(null);
  };

  const updateMember = (id: string, key: keyof AboutMember, value: string | boolean) => {
    setTeamMembers((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    setSaved(false);
    setError(null);
  };

  const removeMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((item) => item.id !== id));
    setSaved(false);
    setError(null);
  };

  const addMilestone = () => {
    setTimelineMilestones((prev) => [
      ...prev,
      {
        id: createClientId("milestone"),
        year: String(new Date().getFullYear()),
        title: "",
        description: "",
      },
    ]);
    setSaved(false);
    setError(null);
  };

  const updateMilestone = (id: string, key: keyof AboutMilestone, value: string) => {
    setTimelineMilestones((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    setSaved(false);
    setError(null);
  };

  const removeMilestone = (id: string) => {
    setTimelineMilestones((prev) => prev.filter((item) => item.id !== id));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            heroTitle,
            storyText,
            teamCurrentLabel,
            teamAlumniLabel,
            timelineHeading,
            valueCards,
          },
          members: teamMembers,
          milestones: timelineMilestones,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to save About page.");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save About page.");
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">About Studio</h1>
          <p className="text-sm text-steel-gray mt-1">
            Edit About story, board roles, and timeline content.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-signal-orange text-white text-xs font-medium hover:bg-[var(--signal-orange-hover)] transition-colors disabled:opacity-50"
        >
          {saved ? <Check size={12} /> : <Save size={12} />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-ice-white text-sm">Story</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Hero Title</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => {
                setHeroTitle(e.target.value);
                setSaved(false);
                setError(null);
              }}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Story Text</label>
            <textarea
              value={storyText}
              onChange={(e) => {
                setStoryText(e.target.value);
                setSaved(false);
                setError(null);
              }}
              rows={5}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h3 className="font-heading font-semibold text-ice-white text-sm">Section Labels</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Current Team Label</label>
            <input
              type="text"
              value={teamCurrentLabel}
              onChange={(e) => {
                setTeamCurrentLabel(e.target.value);
                setSaved(false);
                setError(null);
              }}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Alumni Label</label>
            <input
              type="text"
              value={teamAlumniLabel}
              onChange={(e) => {
                setTeamAlumniLabel(e.target.value);
                setSaved(false);
                setError(null);
              }}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Timeline Heading</label>
            <input
              type="text"
              value={timelineHeading}
              onChange={(e) => {
                setTimelineHeading(e.target.value);
                setSaved(false);
                setError(null);
              }}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-ice-white text-sm">Value Cards</h3>
          <button onClick={addValueCard} className="inline-flex items-center gap-1 text-xs text-signal-orange hover:underline">
            <Plus size={12} /> Add Card
          </button>
        </div>
        <div className="space-y-2">
          {valueCards.map((card, index) => (
            <div key={`${card.title}-${index}`} className="flex items-center gap-2">
              <input
                type="text"
                value={card.title}
                onChange={(e) => updateValueCard(index, "title", e.target.value)}
                placeholder="Card title"
                className="w-1/3 px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
              />
              <input
                type="text"
                value={card.desc}
                onChange={(e) => updateValueCard(index, "desc", e.target.value)}
                placeholder="Card description"
                className="flex-1 px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
              />
              <button onClick={() => removeValueCard(index)} className="p-2 text-steel-gray hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {valueCards.length === 0 && (
            <p className="text-sm text-steel-gray/60 py-2">No cards configured yet.</p>
          )}
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-ice-white text-sm">Team Members</h3>
          <button onClick={addMember} className="inline-flex items-center gap-1 text-xs text-signal-orange hover:underline">
            <Plus size={12} /> Add Member
          </button>
        </div>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="rounded-lg border border-[var(--ghost-border)] p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateMember(member.id, "name", e.target.value)}
                  placeholder="Name"
                  className="px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
                <input
                  type="text"
                  value={member.role}
                  onChange={(e) => updateMember(member.id, "role", e.target.value)}
                  placeholder="Role"
                  className="px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
                <input
                  type="text"
                  value={member.image}
                  onChange={(e) => updateMember(member.id, "image", e.target.value)}
                  placeholder="Image URL (optional)"
                  className="px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
                <input
                  type="text"
                  value={member.linkedIn}
                  onChange={(e) => updateMember(member.id, "linkedIn", e.target.value)}
                  placeholder="LinkedIn URL (optional)"
                  className="px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-steel-gray">
                  <input
                    type="checkbox"
                    checked={member.isAlumni}
                    onChange={(e) => updateMember(member.id, "isAlumni", e.target.checked)}
                    className="accent-signal-orange"
                  />
                  Alumni member
                </label>
                <button onClick={() => removeMember(member.id)} className="p-2 text-steel-gray hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {teamMembers.length === 0 && (
            <p className="text-sm text-steel-gray/60 py-2">No team members configured yet.</p>
          )}
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-ice-white text-sm">Timeline Milestones</h3>
          <button
            onClick={addMilestone}
            className="inline-flex items-center gap-1 text-xs text-signal-orange hover:underline"
          >
            <Plus size={12} /> Add Milestone
          </button>
        </div>
        <div className="space-y-3">
          {timelineMilestones.map((milestone) => (
            <div key={milestone.id} className="rounded-lg border border-[var(--ghost-border)] p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="number"
                  value={milestone.year}
                  onChange={(e) => updateMilestone(milestone.id, "year", e.target.value)}
                  placeholder="Year"
                  className="px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
                <input
                  type="text"
                  value={milestone.title}
                  onChange={(e) => updateMilestone(milestone.id, "title", e.target.value)}
                  placeholder="Title"
                  className="md:col-span-2 px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={milestone.description}
                  onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                  placeholder="Description (optional)"
                  className="flex-1 px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
                <button onClick={() => removeMilestone(milestone.id)} className="p-2 text-steel-gray hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {timelineMilestones.length === 0 && (
            <p className="text-sm text-steel-gray/60 py-2">No milestones configured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

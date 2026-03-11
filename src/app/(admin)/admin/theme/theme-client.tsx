"use client";

import { useState } from "react";
import { RotateCcw, Save, Check } from "lucide-react";
import Image from "next/image";

interface ThemeData {
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
  radius: number;
  shadowStrength: string;
  glassIntensity: string;
  noiseOverlay: string;
  motionLevel: string;
  heroVariant: string;
  cardVariant: string;
  timelineVariant: string;
  logoLight: string | null;
  logoDark: string | null;
  favicon: string | null;
}

const defaults: ThemeData = {
  primaryColor: "#F97316",
  backgroundColor: "#0F172A",
  accentColor: "#F97316",
  radius: 16,
  shadowStrength: "medium",
  glassIntensity: "medium",
  noiseOverlay: "subtle",
  motionLevel: "standard",
  heroVariant: "A",
  cardVariant: "elevated",
  timelineVariant: "blueprint",
  logoLight: null,
  logoDark: null,
  favicon: null,
};

function VariantPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-steel-gray uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              value === opt.id
                ? "bg-signal-orange/10 border-signal-orange/30 text-signal-orange"
                : "border-[var(--ghost-border)] text-steel-gray hover:text-ice-white hover:bg-white/5"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeStudioClient({ theme }: { theme: ThemeData & { id: string } }) {
  const [form, setForm] = useState<ThemeData>({ ...theme });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = (key: keyof ThemeData, value: string | number | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setForm({ ...defaults });
    setSaved(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Theme Studio</h1>
          <p className="text-sm text-steel-gray mt-1">
            Customize colors, glass, motion, and component variants.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colors */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-heading font-semibold text-ice-white text-sm">Colors</h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-steel-gray">Primary Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="w-8 h-8 rounded-md border border-[var(--ghost-border)] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-steel-gray">Background Tint</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.backgroundColor}
                  onChange={(e) => update("backgroundColor", e.target.value)}
                  className="w-8 h-8 rounded-md border border-[var(--ghost-border)] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={form.backgroundColor}
                  onChange={(e) => update("backgroundColor", e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Radius & Shadow */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-heading font-semibold text-ice-white text-sm">Shape & Shadow</h3>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-steel-gray">Border Radius: {form.radius}px</label>
              <input
                type="range"
                min={0}
                max={24}
                value={form.radius}
                onChange={(e) => update("radius", parseInt(e.target.value))}
                className="w-full accent-signal-orange"
              />
            </div>

            <VariantPicker
              label="Shadow Strength"
              options={[
                { id: "none", label: "None" },
                { id: "light", label: "Light" },
                { id: "medium", label: "Medium" },
                { id: "strong", label: "Strong" },
              ]}
              value={form.shadowStrength}
              onChange={(v) => update("shadowStrength", v)}
            />
          </div>
        </div>

        {/* Glass & Noise */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-heading font-semibold text-ice-white text-sm">Glass & Texture</h3>

          <VariantPicker
            label="Glass Blur Intensity"
            options={[
              { id: "off", label: "Off" },
              { id: "low", label: "Low" },
              { id: "medium", label: "Medium" },
            ]}
            value={form.glassIntensity}
            onChange={(v) => update("glassIntensity", v)}
          />

          <VariantPicker
            label="Noise Overlay"
            options={[
              { id: "off", label: "Off" },
              { id: "subtle", label: "Subtle" },
            ]}
            value={form.noiseOverlay}
            onChange={(v) => update("noiseOverlay", v)}
          />
        </div>

        {/* Motion */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-heading font-semibold text-ice-white text-sm">Motion</h3>

          <VariantPicker
            label="Motion Level"
            options={[
              { id: "off", label: "Off" },
              { id: "subtle", label: "Subtle" },
              { id: "standard", label: "Standard" },
            ]}
            value={form.motionLevel}
            onChange={(v) => update("motionLevel", v)}
          />
        </div>

        {/* Component Variants */}
        <div className="glass-card p-6 space-y-4 md:col-span-2">
          <h3 className="font-heading font-semibold text-ice-white text-sm">Component Variants</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <VariantPicker
              label="Hero Style"
              options={[
                { id: "A", label: "Split" },
                { id: "B", label: "Centered" },
                { id: "C", label: "Minimal" },
              ]}
              value={form.heroVariant}
              onChange={(v) => update("heroVariant", v)}
            />

            <VariantPicker
              label="Card Style"
              options={[
                { id: "flat", label: "Flat" },
                { id: "elevated", label: "Elevated" },
                { id: "glass", label: "Glass" },
              ]}
              value={form.cardVariant}
              onChange={(v) => update("cardVariant", v)}
            />

            <VariantPicker
              label="Timeline Style"
              options={[
                { id: "minimal", label: "Minimal" },
                { id: "blueprint", label: "Blueprint" },
              ]}
              value={form.timelineVariant}
              onChange={(v) => update("timelineVariant", v)}
            />
          </div>
        </div>

        {/* Logo & Favicon */}
        <div className="glass-card p-6 space-y-4 md:col-span-2">
          <h3 className="font-heading font-semibold text-ice-white text-sm">Logo & Favicon</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(["logoLight", "logoDark", "favicon"] as const).map((field) => {
              const labels: Record<string, string> = {
                logoLight: "Logo (Light bg)",
                logoDark: "Logo (Dark bg)",
                favicon: "Favicon",
              };
              return (
                <div key={field} className="space-y-2">
                  <label className="text-xs text-steel-gray">{labels[field]}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={(form[field] as string) ?? ""}
                      onChange={(e) => update(field, e.target.value || null)}
                      placeholder="/uploads/logo.svg"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-midnight border border-[var(--ghost-border)] text-xs text-ice-white placeholder:text-steel-gray"
                    />
                    <label className="px-3 py-1.5 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 cursor-pointer transition-colors">
                      Upload
                      <input
                        type="file"
                        accept="image/*,.svg,.ico"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append("file", file);
                          fd.append("usedIn", `Theme (${labels[field]})`);
                          const res = await fetch("/api/admin/media", { method: "POST", body: fd });
                          if (res.ok) {
                            const media = await res.json();
                            update(field, media.url);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {form[field] && (
                    <div className="w-12 h-12 rounded-lg bg-midnight border border-[var(--ghost-border)] flex items-center justify-center overflow-hidden">
                      <Image
                        src={form[field] as string}
                        alt={labels[field]}
                        width={48}
                        height={48}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview swatch */}
      <div className="glass-card p-6">
        <h3 className="font-heading font-semibold text-ice-white text-sm mb-4">Preview</h3>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl"
            style={{ backgroundColor: form.primaryColor }}
          />
          <div
            className="w-12 h-12 rounded-xl border border-[var(--ghost-border)]"
            style={{ backgroundColor: form.backgroundColor }}
          />
          <div
            className="h-8 px-4 flex items-center text-sm text-white font-medium"
            style={{
              backgroundColor: form.primaryColor,
              borderRadius: `${form.radius}px`,
            }}
          >
            Button Preview
          </div>
          <div
            className="h-8 px-4 flex items-center text-sm border"
            style={{
              borderRadius: `${form.radius}px`,
              borderColor: form.primaryColor,
              color: form.primaryColor,
            }}
          >
            Outline Preview
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Save, Check, Shield, Database, Globe } from "lucide-react";

export default function SettingsPage() {
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [siteTitle, setSiteTitle] = useState("CRRT — ENSA Agadir");
  const [siteUrl, setSiteUrl] = useState("https://crrt.ensa-agadir.ac.ma");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Settings</h1>
          <p className="text-sm text-steel-gray mt-1">Platform configuration, SMTP, and security.</p>
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

      {/* General */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-signal-orange" />
          <h3 className="font-heading font-semibold text-ice-white text-sm">General</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Site Title</label>
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Site URL</label>
            <input
              type="text"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
        </div>
      </div>

      {/* SMTP */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-signal-orange" />
          <h3 className="font-heading font-semibold text-ice-white text-sm">SMTP Configuration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">SMTP Host</label>
            <input
              type="text"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">SMTP Port</label>
            <input
              type="text"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">SMTP User</label>
            <input
              type="text"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">SMTP Password</label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors">
          Send Test Email
        </button>
      </div>

      {/* Security */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-signal-orange" />
          <h3 className="font-heading font-semibold text-ice-white text-sm">Security</h3>
        </div>
        <p className="text-sm text-steel-gray">
          Authentication is managed via NextAuth.js. Configure providers in your environment variables.
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-steel-gray">
          <span className="px-3 py-1.5 rounded-lg bg-midnight border border-[var(--ghost-border)]">
            NEXTAUTH_SECRET: ••••••••
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-midnight border border-[var(--ghost-border)]">
            DATABASE_URL: file:./dev.db
          </span>
        </div>
      </div>
    </div>
  );
}

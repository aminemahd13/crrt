"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Save,
  Check,
  Shield,
  Database,
  Globe,
  Mail,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

interface SettingsState {
  siteTitle: string;
  siteUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpFrom: string;
  adminEmail: string;
}

const INITIAL_SETTINGS: SettingsState = {
  siteTitle: "CRRT - ENSA Agadir",
  siteUrl: "http://localhost:3000",
  smtpHost: "",
  smtpPort: 587,
  smtpFrom: "",
  adminEmail: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) throw new Error("Failed to load settings");
        const payload = await response.json();
        setSettings({
          siteTitle: payload.siteTitle ?? INITIAL_SETTINGS.siteTitle,
          siteUrl: payload.siteUrl ?? INITIAL_SETTINGS.siteUrl,
          smtpHost: payload.smtpHost ?? "",
          smtpPort: payload.smtpPort ?? 587,
          smtpFrom: payload.smtpFrom ?? "",
          adminEmail: payload.adminEmail ?? "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const canSubmitPassword = useMemo(() => {
    return currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;
  }, [currentPassword, newPassword, confirmPassword]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Failed to save settings");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        setTestResult({ ok: true, message: "Test email sent. Check your inbox." });
      } else {
        setTestResult({ ok: false, message: data.error || "Failed to send test email" });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error - check your connection" });
    }
    setTesting(false);
  };

  const handlePasswordUpdate = async () => {
    if (!canSubmitPassword) return;
    setPasswordSaving(true);
    setPasswordMessage(null);

    try {
      const response = await fetch("/api/admin/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setPasswordMessage({ ok: false, text: payload.error || "Failed to update password" });
      } else {
        setPasswordMessage({ ok: true, text: "Password updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordMessage({ ok: false, text: "Failed to update password" });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-sm text-steel-gray">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-ice-white">Settings</h1>
          <p className="text-sm text-steel-gray mt-1">Platform configuration, SMTP metadata, and security.</p>
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
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-signal-orange" />
          <h3 className="font-heading font-semibold text-ice-white text-sm">General</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Site Title</label>
            <input
              type="text"
              value={settings.siteTitle}
              onChange={(e) => setSettings((prev) => ({ ...prev, siteTitle: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Site URL</label>
            <input
              type="text"
              value={settings.siteUrl}
              onChange={(e) => setSettings((prev) => ({ ...prev, siteUrl: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Admin Email</label>
            <input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => setSettings((prev) => ({ ...prev, adminEmail: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-signal-orange" />
          <h3 className="font-heading font-semibold text-ice-white text-sm">SMTP Metadata</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">SMTP Host</label>
            <input
              type="text"
              value={settings.smtpHost}
              onChange={(e) => setSettings((prev) => ({ ...prev, smtpHost: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">SMTP Port</label>
            <input
              type="number"
              value={settings.smtpPort}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  smtpPort: Number.parseInt(e.target.value || "587", 10),
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">SMTP From</label>
            <input
              type="text"
              value={settings.smtpFrom}
              onChange={(e) => setSettings((prev) => ({ ...prev, smtpFrom: e.target.value }))}
              placeholder="CRRT <notifications@example.com>"
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
        </div>

        <div className="border-t border-[var(--ghost-border)] pt-4 space-y-3">
          <label className="text-xs text-steel-gray">Test Email Delivery</label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@ensa-agadir.ac.ma"
              className="flex-1 px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white placeholder:text-steel-gray"
            />
            <button
              onClick={handleTestEmail}
              disabled={testing || !testEmail}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <Mail size={12} />
              {testing ? "Sending..." : "Send Test Email"}
            </button>
          </div>
          {testResult && (
            <div className={`flex items-center gap-2 text-xs ${testResult.ok ? "text-emerald-400" : "text-red-400"}`}>
              {testResult.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-signal-orange" />
          <h3 className="font-heading font-semibold text-ice-white text-sm">Password Rotation</h3>
        </div>
        <p className="text-xs text-steel-gray">
          Seeded admin credentials should be changed in production. This is a warning-only policy.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (8+ chars)"
            className="px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
          />
        </div>
        <button
          onClick={handlePasswordUpdate}
          disabled={passwordSaving || !canSubmitPassword}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 disabled:opacity-50"
        >
          <Shield size={12} />
          {passwordSaving ? "Updating..." : "Update Password"}
        </button>
        {passwordMessage && (
          <div
            className={`text-xs ${passwordMessage.ok ? "text-emerald-400" : "text-red-400"} flex items-center gap-2`}
          >
            {passwordMessage.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {passwordMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}

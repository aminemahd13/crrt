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
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapFolderInbox: string;
  imapFolderSent: string;
  imapFolderDrafts: string;
  imapFolderArchive: string;
  imapFolderTrash: string;
  imapSyncIntervalSeconds: number;
  imapInitialSyncDays: number;
}

const INITIAL_SETTINGS: SettingsState = {
  siteTitle: "CRRT - ENSA Agadir",
  siteUrl: "http://localhost:3300",
  smtpHost: "smtp.purelymail.com",
  smtpPort: 465,
  smtpFrom: "",
  adminEmail: "",
  imapHost: "imap.purelymail.com",
  imapPort: 993,
  imapSecure: true,
  imapFolderInbox: "INBOX",
  imapFolderSent: "Sent",
  imapFolderDrafts: "Drafts",
  imapFolderArchive: "Archive",
  imapFolderTrash: "Trash",
  imapSyncIntervalSeconds: 30,
  imapInitialSyncDays: 90,
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
  const [imapTesting, setImapTesting] = useState(false);
  const [imapTestResult, setImapTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [imapSecretsPresent, setImapSecretsPresent] = useState<boolean | null>(null);

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
          smtpHost: payload.smtpHost ?? "smtp.purelymail.com",
          smtpPort: payload.smtpPort ?? 465,
          smtpFrom: payload.smtpFrom ?? "",
          adminEmail: payload.adminEmail ?? "",
          imapHost: payload.imapHost ?? "imap.purelymail.com",
          imapPort: payload.imapPort ?? 993,
          imapSecure: typeof payload.imapSecure === "boolean" ? payload.imapSecure : true,
          imapFolderInbox: payload.imapFolderInbox ?? "INBOX",
          imapFolderSent: payload.imapFolderSent ?? "Sent",
          imapFolderDrafts: payload.imapFolderDrafts ?? "Drafts",
          imapFolderArchive: payload.imapFolderArchive ?? "Archive",
          imapFolderTrash: payload.imapFolderTrash ?? "Trash",
          imapSyncIntervalSeconds: payload.imapSyncIntervalSeconds ?? 30,
          imapInitialSyncDays: payload.imapInitialSyncDays ?? 90,
        });
        const inboxStatusResponse = await fetch("/api/admin/inbox/sync", { cache: "no-store" });
        const inboxPayload = await inboxStatusResponse.json().catch(() => ({}));
        if (inboxStatusResponse.ok && typeof inboxPayload.hasImapSecrets === "boolean") {
          setImapSecretsPresent(inboxPayload.hasImapSecrets);
        } else {
          setImapSecretsPresent(null);
        }
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

  const handleTestImap = async () => {
    setImapTesting(true);
    setImapTestResult(null);
    try {
      const response = await fetch("/api/admin/inbox/test-imap", {
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setImapTestResult({ ok: true, message: "IMAP connection succeeded." });
      } else {
        setImapTestResult({ ok: false, message: payload.error || "IMAP test failed." });
      }
    } catch {
      setImapTestResult({ ok: false, message: "Network error while testing IMAP." });
    } finally {
      setImapTesting(false);
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
                  smtpPort: Number.parseInt(e.target.value || "465", 10),
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
              placeholder="CRRT <contact@crrt.tech>"
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
              placeholder="test@test.com"
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
          <Mail size={16} className="text-signal-orange" />
          <h3 className="font-heading font-semibold text-ice-white text-sm">IMAP Metadata</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">IMAP Host</label>
            <input
              type="text"
              value={settings.imapHost}
              onChange={(e) => setSettings((prev) => ({ ...prev, imapHost: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">IMAP Port</label>
            <input
              type="number"
              value={settings.imapPort}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  imapPort: Number.parseInt(e.target.value || "993", 10),
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <label className="flex items-center gap-2 self-end text-xs text-steel-gray">
            <input
              type="checkbox"
              checked={settings.imapSecure}
              onChange={(e) => setSettings((prev) => ({ ...prev, imapSecure: e.target.checked }))}
            />
            Use TLS/SSL
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Inbox Folder</label>
            <input
              type="text"
              value={settings.imapFolderInbox}
              onChange={(e) => setSettings((prev) => ({ ...prev, imapFolderInbox: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Sent Folder</label>
            <input
              type="text"
              value={settings.imapFolderSent}
              onChange={(e) => setSettings((prev) => ({ ...prev, imapFolderSent: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Drafts Folder</label>
            <input
              type="text"
              value={settings.imapFolderDrafts}
              onChange={(e) => setSettings((prev) => ({ ...prev, imapFolderDrafts: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Archive Folder</label>
            <input
              type="text"
              value={settings.imapFolderArchive}
              onChange={(e) => setSettings((prev) => ({ ...prev, imapFolderArchive: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Trash Folder</label>
            <input
              type="text"
              value={settings.imapFolderTrash}
              onChange={(e) => setSettings((prev) => ({ ...prev, imapFolderTrash: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Auto Sync Interval (seconds)</label>
            <input
              type="number"
              value={settings.imapSyncIntervalSeconds}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  imapSyncIntervalSeconds: Number.parseInt(e.target.value || "30", 10),
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-steel-gray">Initial Sync Window (days)</label>
            <input
              type="number"
              value={settings.imapInitialSyncDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  imapInitialSyncDays: Number.parseInt(e.target.value || "90", 10),
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-midnight border border-[var(--ghost-border)] text-sm text-ice-white"
            />
          </div>
        </div>

        <div className="border-t border-[var(--ghost-border)] pt-4 space-y-3">
          <p className="text-xs text-steel-gray">
            IMAP credentials (`IMAP_USER`, `IMAP_PASS`) remain environment-only.
          </p>
          {imapSecretsPresent === false ? (
            <p className="text-xs text-amber-300">
              IMAP secrets are currently missing from environment.
            </p>
          ) : null}
          <button
            onClick={handleTestImap}
            disabled={imapTesting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--ghost-border)] text-xs text-steel-gray hover:text-ice-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <Mail size={12} />
            {imapTesting ? "Testing..." : "Test IMAP Connection"}
          </button>
          {imapTestResult ? (
            <div className={`text-xs ${imapTestResult.ok ? "text-emerald-400" : "text-red-400"} flex items-center gap-2`}>
              {imapTestResult.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {imapTestResult.message}
            </div>
          ) : null}
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

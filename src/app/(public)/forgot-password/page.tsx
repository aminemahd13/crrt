"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { appCopy } from "@/lib/copy";

export default function ForgotPasswordPage() {
  const messages = appCopy;
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setResultMessage(null);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        const message = payload.error ?? "Unable to request reset link.";
        setError(message);
        toast.error(message);
        return;
      }

      setResultMessage(messages.auth.resetLinkSent);
      toast.success(messages.auth.resetLinkSent);
    } catch {
      setError("Unable to request reset link.");
      toast.error("Unable to request reset link.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative mx-auto max-w-md px-6 py-16">
      <Card className="relative glass-card border-[var(--ghost-border)] py-0 text-ice-white">
        <CardHeader className="space-y-2 border-b border-[var(--ghost-border)] px-8 py-6">
          <CardTitle className="font-heading text-3xl">{messages.auth.resetPasswordTitle}</CardTitle>
          <CardDescription className="text-steel-gray">{messages.auth.resetPasswordSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-8 py-6">
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/60"
          />

          {error ? (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          ) : null}

          {resultMessage ? (
            <Alert className="border-emerald-500/20 bg-emerald-500/10">
              <AlertDescription className="text-emerald-300">{resultMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? "Sending..." : messages.auth.sendResetLink}
          </Button>

          <p className="text-sm text-steel-gray">
            Remembered your password?{" "}
            <Link href="/login" className="text-signal-orange hover:underline">
              {messages.auth.signInLink}
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

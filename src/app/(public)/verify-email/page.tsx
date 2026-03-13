"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { appCopy } from "@/lib/copy";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const messages = appCopy;
  const token = useMemo(() => (searchParams.get("token") ?? "").trim(), [searchParams]);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const verify = async () => {
    if (!token) {
      setState("error");
      setMessage("Missing verification token.");
      return;
    }

    setSubmitting(true);
    setState("idle");
    setMessage("");

    try {
      const response = await fetch("/api/auth/email-verification/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        const text = payload.error ?? "Unable to verify email.";
        setState("error");
        setMessage(text);
        toast.error(text);
        return;
      }

      const payload = (await response.json()) as { changedEmail?: boolean };
      const text = payload.changedEmail
        ? "Your email address has been updated and verified."
        : "Your email is now verified.";
      setState("success");
      setMessage(text);
      toast.success(text);
    } catch {
      setState("error");
      setMessage("Unable to verify email.");
      toast.error("Unable to verify email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="relative mx-auto max-w-md px-6 py-16">
      <Card className="relative glass-card border-[var(--ghost-border)] py-0 text-ice-white">
        <CardHeader className="space-y-2 border-b border-[var(--ghost-border)] px-8 py-6">
          <CardTitle className="font-heading text-3xl">{messages.auth.verifyEmailTitle}</CardTitle>
          <CardDescription className="text-steel-gray">{messages.auth.verifyEmailSubtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-8 py-6">
          {!token ? (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertDescription className="text-red-400">Missing verification token.</AlertDescription>
            </Alert>
          ) : null}

          {state === "success" ? (
            <Alert className="border-emerald-500/20 bg-emerald-500/10">
              <AlertDescription className="text-emerald-300">{message}</AlertDescription>
            </Alert>
          ) : null}

          {state === "error" ? (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertDescription className="text-red-400">{message}</AlertDescription>
            </Alert>
          ) : null}

          <Button onClick={verify} disabled={submitting || !token} className="w-full">
            {submitting ? "Verifying..." : messages.auth.verifyEmailAction}
          </Button>

          <p className="text-sm text-steel-gray">
            <Link href="/login" className="text-signal-orange hover:underline">
              {messages.auth.signInLink}
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

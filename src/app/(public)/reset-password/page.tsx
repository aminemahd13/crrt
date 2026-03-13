"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { appCopy } from "@/lib/copy";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters.").max(72, "Password is too long."),
    confirmPassword: z.string().min(8, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type ResetValues = z.infer<typeof resetSchema>;

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messages = appCopy;
  const token = useMemo(() => (searchParams.get("token") ?? "").trim(), [searchParams]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const submit = async (values: ResetValues) => {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        const message = payload.error ?? "Unable to reset password.";
        setServerError(message);
        toast.error(message);
        return;
      }

      setSuccess(true);
      toast.success("Password updated. Please sign in.");
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1200);
    } catch {
      setServerError("Unable to reset password.");
      toast.error("Unable to reset password.");
    }
  };

  return (
    <section className="relative mx-auto max-w-md px-6 py-16">
      <Card className="relative glass-card border-[var(--ghost-border)] py-0 text-ice-white">
        <CardHeader className="space-y-2 border-b border-[var(--ghost-border)] px-8 py-6">
          <CardTitle className="font-heading text-3xl">{messages.auth.requestReset}</CardTitle>
          <CardDescription className="text-steel-gray">Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="px-8 py-6">
          {!token ? (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertDescription className="text-red-400">
                Missing reset token. Request a new reset link.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          className="border-[var(--ghost-border)] bg-midnight text-ice-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          autoComplete="new-password"
                          className="border-[var(--ghost-border)] bg-midnight text-ice-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {serverError ? (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                    <AlertDescription className="text-red-400">{serverError}</AlertDescription>
                  </Alert>
                ) : null}

                {success ? (
                  <Alert className="border-emerald-500/20 bg-emerald-500/10">
                    <AlertDescription className="text-emerald-300">Password updated successfully.</AlertDescription>
                  </Alert>
                ) : null}

                <Button type="submit" disabled={form.formState.isSubmitting || success} className="w-full">
                  {form.formState.isSubmitting ? "Updating..." : "Update password"}
                </Button>
              </form>
            </Form>
          )}

          <p className="mt-5 text-sm text-steel-gray">
            <Link href="/forgot-password" className="text-signal-orange hover:underline">
              Request a new reset link
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

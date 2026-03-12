"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSession, signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginSchema, type LoginValues } from "@/lib/forms/auth-schemas";
import { appCopy } from "@/lib/copy";

function normalizeCallbackUrl(value: string | null): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("/admin/login")) return "/admin";
  if (value.startsWith("/login")) return null;
  return value;
}

function defaultRouteForRole(role: string | null | undefined): string {
  return role === "admin" ? "/admin" : "/dashboard";
}

function resolvePostLoginRoute(
  callbackUrl: string | null,
  role: string | null | undefined
): string {
  const fallback = defaultRouteForRole(role);
  if (!callbackUrl) return fallback;
  if (callbackUrl.startsWith("/admin") && role !== "admin") {
    return fallback;
  }
  return callbackUrl;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const messages = appCopy;
  const [serverError, setServerError] = useState<string | null>(null);

  const callbackUrl = useMemo(
    () => normalizeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams]
  );

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string } | undefined)?.role ?? null;
    router.replace(resolvePostLoginRoute(callbackUrl, role));
  }, [callbackUrl, router, session, status]);

  const handleSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      const result = await signIn("credentials", {
        email: values.email.trim(),
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError(messages.auth.invalidCredentials);
        toast.error(messages.auth.invalidCredentials);
        return;
      }

      const nextSession = await getSession();
      const role = (nextSession?.user as { role?: string } | undefined)?.role ?? null;
      const target = resolvePostLoginRoute(callbackUrl, role);

      router.push(target);
      router.refresh();
    } catch {
      setServerError(messages.auth.unableToSignIn);
      toast.error(messages.auth.unableToSignIn);
    }
  };

  if (status === "authenticated") {
    return null;
  }

  const signupCallback = callbackUrl ?? "/dashboard";

  return (
    <section className="relative mx-auto max-w-md px-6 py-16">
      {/* Decorative background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-signal-orange/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <Card className="relative glass-card border-[var(--ghost-border)] py-0 text-ice-white">
        <CardHeader className="space-y-2 border-b border-[var(--ghost-border)] px-8 py-6">
          <CardTitle className="font-heading text-3xl">
            {messages.auth.signInTitle}
          </CardTitle>
          <CardDescription className="text-steel-gray">
            {messages.auth.signInSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 py-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{messages.auth.email}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{messages.auth.password}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="********"
                        className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/60"
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

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {messages.auth.signingIn}
                  </span>
                ) : (
                  messages.auth.signIn
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-5 text-sm text-steel-gray">
            {messages.auth.noAccount}{" "}
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(signupCallback)}`}
              className="text-signal-orange hover:underline"
            >
              {messages.auth.signupLink}
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

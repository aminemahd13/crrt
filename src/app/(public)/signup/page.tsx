"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signupSchema, type SignupValues } from "@/lib/forms/auth-schemas";
import { appCopy } from "@/lib/copy";

interface SignupErrorPayload {
  error?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messages = appCopy;
  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl");
    if (!raw || !raw.startsWith("/")) return "/dashboard";
    if (raw.startsWith("/admin")) return "/dashboard";
    return raw;
  }, [searchParams]);

  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (values: SignupValues) => {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email.trim(),
          password: values.password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as SignupErrorPayload;
        const message = payload.error || messages.auth.unableToSignup;
        setServerError(message);
        toast.error(message);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: values.email.trim(),
        password: values.password,
        callbackUrl,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      router.push(signInResult?.url ?? callbackUrl);
      router.refresh();
    } catch {
      setServerError(messages.auth.unableToSignup);
      toast.error(messages.auth.unableToSignup);
    }
  };

  return (
    <section className="mx-auto max-w-md px-6 py-16">
      <Card className="glass-card border-[var(--ghost-border)] py-0 text-ice-white">
        <CardHeader className="space-y-2 border-b border-[var(--ghost-border)] px-8 py-6">
          <CardTitle className="font-heading text-3xl">
            {messages.auth.signupTitle}
          </CardTitle>
          <CardDescription className="text-steel-gray">
            {messages.auth.signupSubtitle}
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{messages.auth.fullName}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="signup-name"
                        autoComplete="name"
                        placeholder={messages.auth.optional}
                        className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{messages.auth.email}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="signup-email"
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
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/60"
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
                    <FormLabel>{messages.auth.confirmPassword}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="signup-password-confirm"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        className="border-[var(--ghost-border)] bg-midnight text-ice-white placeholder:text-steel-gray/60"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError ? (
                <p className="text-sm text-red-400" role="alert">
                  {serverError}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full"
              >
                {form.formState.isSubmitting
                  ? messages.auth.creatingAccount
                  : messages.auth.createAccount}
              </Button>
            </form>
          </Form>

          <p className="mt-5 text-sm text-steel-gray">
            {messages.auth.alreadyHaveAccount}{" "}
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-signal-orange hover:underline"
            >
              {messages.auth.signInLink}
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

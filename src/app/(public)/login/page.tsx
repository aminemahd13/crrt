"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSession, signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function normalizeCallbackUrl(value: string | null): string | null {
  if (!value || !value.startsWith("/")) return null;
  if (value.startsWith("/admin/login")) return "/admin";
  if (value.startsWith("/login")) return null;
  return value;
}

function defaultRouteForRole(role: string | null | undefined): string {
  return role === "admin" || role === "editor" ? "/admin" : "/dashboard";
}

function resolvePostLoginRoute(callbackUrl: string | null, role: string | null | undefined): string {
  const fallback = defaultRouteForRole(role);
  if (!callbackUrl) return fallback;
  if (callbackUrl.startsWith("/admin") && role !== "admin" && role !== "editor") {
    return fallback;
  }
  return callbackUrl;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const callbackUrl = useMemo(
    () => normalizeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string } | undefined)?.role ?? null;
    router.replace(resolvePostLoginRoute(callbackUrl, role));
  }, [callbackUrl, router, session, status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      const nextSession = await getSession();
      const role = (nextSession?.user as { role?: string } | undefined)?.role ?? null;
      const target = resolvePostLoginRoute(callbackUrl, role);

      router.push(target);
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setIsPending(false);
    }
  };

  if (status === "authenticated") {
    return null;
  }

  const signupCallback = callbackUrl ?? "/dashboard";

  return (
    <section className="max-w-md mx-auto px-6 py-16">
      <div className="glass-card p-8">
        <h1 className="font-heading text-3xl text-ice-white mb-2">Sign In</h1>
        <p className="text-steel-gray text-sm mb-6">One login portal for members, editors, and admins.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-xs text-steel-gray uppercase tracking-wider">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="w-full rounded-xl bg-midnight border border-[var(--ghost-border)] px-3 py-2.5 text-sm text-ice-white placeholder:text-steel-gray/50 focus:outline-none focus:border-signal-orange/30"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-xs text-steel-gray uppercase tracking-wider">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl bg-midnight border border-[var(--ghost-border)] px-3 py-2.5 text-sm text-ice-white placeholder:text-steel-gray/50 focus:outline-none focus:border-signal-orange/30"
              placeholder="********"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-signal-orange py-2.5 text-sm font-medium text-white hover:bg-[var(--signal-orange-hover)] disabled:opacity-60"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-steel-gray mt-5">
          No account yet?{" "}
          <Link
            href={`/signup?callbackUrl=${encodeURIComponent(signupCallback)}`}
            className="text-signal-orange hover:underline"
          >
            Create one
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl");
    return raw && raw.startsWith("/") ? raw : "/dashboard";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(result?.url ?? callbackUrl);
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="max-w-md mx-auto px-6 py-16">
      <div className="glass-card p-8">
        <h1 className="font-heading text-3xl text-ice-white mb-2">Sign In</h1>
        <p className="text-steel-gray text-sm mb-6">Access your dashboard and event registrations.</p>

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
            href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
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

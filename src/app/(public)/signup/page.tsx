"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface SignupErrorPayload {
  error?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(() => {
    const raw = searchParams.get("callbackUrl");
    if (!raw || !raw.startsWith("/")) return "/dashboard";
    if (raw.startsWith("/admin")) return "/dashboard";
    return raw;
  }, [searchParams]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as SignupErrorPayload;
        setError(payload.error || "Unable to create account.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: email.trim(),
        password,
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
      setError("Unable to create account right now.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="max-w-md mx-auto px-6 py-16">
      <div className="glass-card p-8">
        <h1 className="font-heading text-3xl text-ice-white mb-2">Create Account</h1>
        <p className="text-steel-gray text-sm mb-6">Sign up as a member to register for events and access resources.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="signup-name" className="text-xs text-steel-gray uppercase tracking-wider">
              Full Name
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              className="w-full rounded-xl bg-midnight border border-[var(--ghost-border)] px-3 py-2.5 text-sm text-ice-white placeholder:text-steel-gray/50 focus:outline-none focus:border-signal-orange/30"
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-email" className="text-xs text-steel-gray uppercase tracking-wider">
              Email
            </label>
            <input
              id="signup-email"
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
            <label htmlFor="signup-password" className="text-xs text-steel-gray uppercase tracking-wider">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl bg-midnight border border-[var(--ghost-border)] px-3 py-2.5 text-sm text-ice-white placeholder:text-steel-gray/50 focus:outline-none focus:border-signal-orange/30"
              placeholder="At least 8 characters"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-password-confirm" className="text-xs text-steel-gray uppercase tracking-wider">
              Confirm Password
            </label>
            <input
              id="signup-password-confirm"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl bg-midnight border border-[var(--ghost-border)] px-3 py-2.5 text-sm text-ice-white placeholder:text-steel-gray/50 focus:outline-none focus:border-signal-orange/30"
              placeholder="Repeat password"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-signal-orange py-2.5 text-sm font-medium text-white hover:bg-[var(--signal-orange-hover)] disabled:opacity-60"
          >
            {isPending ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-steel-gray mt-5">
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-signal-orange hover:underline"
          >
            Sign in
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

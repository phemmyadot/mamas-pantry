"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    const result = await login(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.requiresPhoneVerification) {
      router.push("/verify-phone");
    } else {
      router.push("/");
    }
  }

  return (
    <div>
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-deep">
          Mama<em className="italic text-gold">&apos;s</em> Pantry
        </h1>
        <p className="font-body text-sm italic text-muted mt-1">
          Chosen with care. Stocked with love.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-cream-dark p-8">
        <h2 className="font-display text-xl font-bold text-forest-deep mb-6">
          Sign in
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium font-ui text-ink mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-ink font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium font-ui text-ink"
              >
                Password
              </label>
              <Link
                href="/reset-password"
                className="text-xs font-ui text-forest-light hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-ink font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              placeholder="Your password"
            />
          </div>

          {error && (
            <p className="text-sm text-spice font-ui">{error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-forest-deep text-cream font-ui font-medium text-sm py-2.5 rounded-lg hover:bg-forest-mid transition-colors disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-ui text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-forest-light font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

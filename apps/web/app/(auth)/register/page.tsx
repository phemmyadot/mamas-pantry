"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth, ApiError, setCookie } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await auth.register(email, password);
      // Auto-login after registration
      const tokens = await auth.login(email, password);
      setCookie("mp_access", (tokens as { access_token: string }).access_token, 15 * 60);
      setCookie("mp_refresh", (tokens as { refresh_token: string }).refresh_token, 7 * 24 * 60 * 60);
      router.push("/verify-phone");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Registration failed. Try again.");
    } finally {
      setPending(false);
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
          Create your account
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
            <label
              htmlFor="password"
              className="block text-sm font-medium font-ui text-ink mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-ink font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              placeholder="At least 8 characters"
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
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-ui text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-forest-light font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

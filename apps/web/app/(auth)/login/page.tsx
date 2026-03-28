"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setPending(true);
    const result = await login(email, password);
    setPending(false);
    if (!result.ok) {
      if (result.error === "email_not_verified") {
        setUnverified(true);
      } else {
        setError(result.error);
      }
      return;
    }
    router.push("/");
  }

  async function handleResend() {
    setResendPending(true);
    try {
      await auth.resendVerification(email);
    } catch {
      // best-effort — always show done to avoid enumeration
    } finally {
      setResendPending(false);
      setResendDone(true);
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

      {unverified ? (
        <div className="bg-white rounded-xl shadow-sm border border-cream-dark p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-forest-mist flex items-center justify-center mx-auto text-2xl">
            ✉️
          </div>
          <h2 className="font-display text-xl font-bold text-forest-deep">Verify your email</h2>
          <p className="font-body text-sm italic text-muted">
            Your account isn&apos;t verified yet. Check your inbox for the verification link, or resend it below.
          </p>
          {resendDone ? (
            <p className="font-ui text-sm text-forest-light font-medium">
              Verification email sent — check your inbox.
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendPending}
              className="inline-block bg-forest-deep text-cream font-ui font-medium text-sm px-6 py-2.5 rounded-lg hover:bg-forest-mid transition-colors disabled:opacity-60"
            >
              {resendPending ? "Sending…" : "Resend verification email"}
            </button>
          )}
          <p className="text-sm font-ui text-muted">
            <button
              onClick={() => setUnverified(false)}
              className="text-forest-light hover:underline"
            >
              Back to sign in
            </button>
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
}

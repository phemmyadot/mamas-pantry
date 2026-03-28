"use client";

import Link from "next/link";
import { useState } from "react";
import { auth, ApiError } from "@/lib/api";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await auth.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      // Backend always returns 204 even for unknown emails — only show real errors
      if (err instanceof ApiError && err.status !== 204) {
        setError(err.detail);
      } else {
        setSent(true);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-deep">
          Mama<em className="italic text-gold">&apos;s</em> Pantry
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-cream-dark p-8">
        {sent ? (
          <div className="text-center">
            <div className="text-3xl mb-4">📬</div>
            <h2 className="font-display text-xl font-bold text-forest-deep mb-2">
              Check your email
            </h2>
            <p className="font-ui text-sm text-muted mb-6">
              If an account exists for <strong className="text-ink">{email}</strong>, you&apos;ll receive a reset link shortly.
            </p>
            <Link
              href="/login"
              className="text-sm font-ui text-forest-light hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-forest-deep mb-2">
              Reset your password
            </h2>
            <p className="font-ui text-sm text-muted mb-6">
              Enter your email and we&apos;ll send you a reset link.
            </p>

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

              {error && <p className="text-sm text-spice font-ui">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full bg-forest-deep text-cream font-ui font-medium text-sm py-2.5 rounded-lg hover:bg-forest-mid transition-colors disabled:opacity-60"
              >
                {pending ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm font-ui text-muted">
              <Link href="/login" className="text-forest-light font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

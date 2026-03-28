"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { auth, ApiError } from "@/lib/api";

export default function ResetPasswordConfirmPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setPending(true);
    try {
      await auth.confirmPasswordReset(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : "Reset failed. The link may have expired."
      );
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
        {!token ? (
          <div className="text-center">
            <p className="font-ui text-sm text-spice mb-4">
              Invalid or missing reset token.
            </p>
            <Link href="/reset-password" className="text-sm font-ui text-forest-light hover:underline">
              Request a new link
            </Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="text-3xl mb-4">✅</div>
            <h2 className="font-display text-xl font-bold text-forest-deep mb-2">
              Password updated
            </h2>
            <p className="font-ui text-sm text-muted">Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-forest-deep mb-6">
              Set a new password
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium font-ui text-ink mb-1"
                >
                  New password
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

              <div>
                <label
                  htmlFor="confirm"
                  className="block text-sm font-medium font-ui text-ink mb-1"
                >
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-ink font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
                  placeholder="Repeat password"
                />
              </div>

              {error && <p className="text-sm text-spice font-ui">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full bg-forest-deep text-cream font-ui font-medium text-sm py-2.5 rounded-lg hover:bg-forest-mid transition-colors disabled:opacity-60"
              >
                {pending ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

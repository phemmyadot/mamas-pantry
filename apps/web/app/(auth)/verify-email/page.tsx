"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth, ApiError } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("No verification token found.");
      setStatus("error");
      return;
    }
    auth
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setErrorMsg(err instanceof ApiError ? err.detail : "Verification failed.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-deep">
          Mama<em className="italic text-gold">&apos;s</em> Pantry
        </h1>
        <p className="font-body text-sm italic text-muted mt-1">
          Chosen with care. Stocked with love.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-cream-dark p-8 text-center space-y-4">
        {status === "pending" && (
          <>
            <div className="w-12 h-12 rounded-full bg-forest-mist flex items-center justify-center mx-auto text-2xl animate-pulse">
              ✉️
            </div>
            <p className="font-ui text-sm text-muted">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 rounded-full bg-forest-mist flex items-center justify-center mx-auto text-2xl">
              ✅
            </div>
            <h2 className="font-display text-xl font-bold text-forest-deep">Email verified!</h2>
            <p className="font-body text-sm italic text-muted">
              Your account is active. You can now sign in.
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 bg-forest-deep text-cream font-ui font-medium text-sm px-6 py-2.5 rounded-lg hover:bg-forest-mid transition-colors"
            >
              Sign in
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-2xl">
              ✗
            </div>
            <h2 className="font-display text-xl font-bold text-forest-deep">
              {errorMsg.includes("already been used") ? "Link already used" : "Verification failed"}
            </h2>
            <p className="font-ui text-sm text-spice">{errorMsg}</p>
            <Link
              href="/login"
              className="inline-block mt-2 bg-forest-deep text-cream font-ui font-medium text-sm px-6 py-2.5 rounded-lg hover:bg-forest-mid transition-colors"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

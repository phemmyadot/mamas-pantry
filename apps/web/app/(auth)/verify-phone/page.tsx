"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { auth, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const OTP_LENGTH = 6;
const RESEND_LIMIT = 3;
const RESEND_WINDOW_SECS = 60 * 60; // 1 hour

export default function VerifyPhonePage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  // Step 1: enter phone. Step 2: enter OTP.
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0); // seconds remaining
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCooldown(secs: number) {
    setResendCooldown(secs);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await auth.sendPhoneOtp(phone);
      setStep("otp");
      setResendCount((c) => c + 1);
      startCooldown(60); // 60s before next resend
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not send OTP. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || resendCount >= RESEND_LIMIT) return;
    setError("");
    setPending(true);
    try {
      await auth.sendPhoneOtp(phone);
      setResendCount((c) => c + 1);
      startCooldown(60);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not resend OTP.");
    } finally {
      setPending(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      (document.getElementById(`otp-${index + 1}`) as HTMLInputElement)?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      (document.getElementById(`otp-${index - 1}`) as HTMLInputElement)?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError("Enter all 6 digits.");
      return;
    }
    setError("");
    setPending(true);
    try {
      await auth.verifyPhoneOtp(code);
      await refreshUser();
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Invalid or expired code.");
      setOtp(Array(OTP_LENGTH).fill(""));
      (document.getElementById("otp-0") as HTMLInputElement)?.focus();
    } finally {
      setPending(false);
    }
  }

  const canResend = resendCount < RESEND_LIMIT && resendCooldown === 0;

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-deep">
          Mama<em className="italic text-gold">&apos;s</em> Pantry
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-cream-dark p-8">
        {step === "phone" ? (
          <>
            <h2 className="font-display text-xl font-bold text-forest-deep mb-2">
              Verify your phone
            </h2>
            <p className="font-ui text-sm text-muted mb-6">
              We&apos;ll send a 6-digit code to your number.
            </p>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium font-ui text-ink mb-1"
                >
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-cream-dark bg-cream text-ink font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
                  placeholder="+2348012345678"
                />
              </div>
              {error && <p className="text-sm text-spice font-ui">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="w-full bg-forest-deep text-cream font-ui font-medium text-sm py-2.5 rounded-lg hover:bg-forest-mid transition-colors disabled:opacity-60"
              >
                {pending ? "Sending…" : "Send code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl font-bold text-forest-deep mb-2">
              Enter the code
            </h2>
            <p className="font-ui text-sm text-muted mb-6">
              Sent to <span className="font-medium text-ink">{phone}</span>
            </p>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-medium border border-cream-dark rounded-lg bg-cream text-ink focus:outline-none focus:ring-2 focus:ring-forest-light"
                  />
                ))}
              </div>

              {error && <p className="text-sm text-spice font-ui text-center">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full bg-forest-deep text-cream font-ui font-medium text-sm py-2.5 rounded-lg hover:bg-forest-mid transition-colors disabled:opacity-60"
              >
                {pending ? "Verifying…" : "Verify"}
              </button>
            </form>

            <div className="mt-4 text-center">
              {resendCount >= RESEND_LIMIT ? (
                <p className="text-xs font-ui text-muted">
                  Resend limit reached. Try again in an hour.
                </p>
              ) : resendCooldown > 0 ? (
                <p className="text-xs font-ui text-muted">
                  Resend in {resendCooldown}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend || pending}
                  className="text-sm font-ui text-forest-light hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(Array(OTP_LENGTH).fill("")); setError(""); }}
              className="mt-2 w-full text-center text-xs font-ui text-muted hover:text-ink"
            >
              Change phone number
            </button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { notifications } from "@/lib/api";

// Firebase config from env vars — all must be set for push to be available
const FIREBASE_CONFIG = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";

const isConfigured = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  !!FIREBASE_CONFIG.apiKey &&
  !!VAPID_KEY;

async function registerAndSubscribe(): Promise<string> {
  // Inject firebase config into SW scope before registration
  const sw = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  // Pass config to the service worker via a postMessage
  sw.active?.postMessage({ type: "FIREBASE_CONFIG", config: FIREBASE_CONFIG });

  // Dynamically import Firebase (compat build already loaded in SW)
  const { initializeApp, getApps } = await import("firebase/app");
  const { getMessaging, getToken } = await import("firebase/messaging");

  const app = getApps().length
    ? getApps()[0]
    : initializeApp(FIREBASE_CONFIG);

  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: sw });
  return token;
}

export default function PushNotificationToggle() {
  const [state, setState] = useState<"idle" | "loading" | "subscribed" | "denied" | "unavailable">("idle");

  useEffect(() => {
    if (!isConfigured()) { setState("unavailable"); return; }
    const perm = Notification.permission;
    if (perm === "granted") setState("subscribed");
    else if (perm === "denied") setState("denied");
  }, []);

  if (state === "unavailable") return null;

  async function handleToggle() {
    if (state === "subscribed") return;
    setState("loading");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState("denied"); return; }
      const token = await registerAndSubscribe();
      await notifications.subscribe(token);
      setState("subscribed");
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-dark p-4 flex items-center justify-between gap-4">
      <div>
        <p className="font-ui text-sm font-semibold text-ink">Order notifications</p>
        <p className="font-body text-xs italic text-muted mt-0.5">
          {state === "subscribed"
            ? "You'll be notified when your order status changes."
            : state === "denied"
            ? "Notifications blocked — enable them in browser settings."
            : "Get push alerts when your order is confirmed, packed, or delivered."}
        </p>
      </div>

      {state !== "denied" && (
        <button
          onClick={handleToggle}
          disabled={state === "loading" || state === "subscribed"}
          className={`flex-shrink-0 relative inline-flex h-6 w-11 rounded-full transition-colors disabled:cursor-default
            ${state === "subscribed" ? "bg-forest-light" : "bg-gray-200"}`}
        >
          <span className={`inline-block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5
            ${state === "subscribed" ? "translate-x-5" : "translate-x-0.5"}`}
          />
        </button>
      )}
    </div>
  );
}

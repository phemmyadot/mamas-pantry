"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoyaltyPointsDisplay from "../_components/LoyaltyPointsDisplay";
import PushNotificationToggle from "../_components/PushNotificationToggle";

const NAV_ITEMS = [
  { href: "/account/orders", icon: "📦", label: "Order history", desc: "View all past and active orders" },
  { href: "/account/addresses", icon: "📍", label: "Saved addresses", desc: "Manage your delivery addresses" },
  { href: "/account/pre-orders", icon: "✈️", label: "Pre-orders", desc: "Track your upcoming pre-orders" },
];

export default function AccountPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!user) return null;

  const displayName = user.username ?? user.email.split("@")[0];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile header */}
      <div className="bg-forest-deep rounded-2xl p-6 mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-forest-mid flex items-center justify-center text-2xl text-cream font-bold flex-shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-xl font-bold text-cream truncate">{displayName}</p>
          <p className="font-ui text-sm text-forest-pale opacity-80 truncate">{user.email}</p>
          {user.is_verified && (
            <span className="inline-block font-ui text-xs font-medium bg-forest-light text-cream px-2 py-0.5 rounded-full mt-1">
              Verified ✓
            </span>
          )}
        </div>
      </div>

      {/* Loyalty points */}
      <div className="mb-4">
        <LoyaltyPointsDisplay />
      </div>

      {/* Nav cards */}
      <div className="space-y-3 mb-6">
        {NAV_ITEMS.map(({ href, icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-2xl border border-cream-dark p-4 hover:border-forest-light hover:shadow-sm transition-all"
          >
            <span className="text-2xl">{icon}</span>
            <div className="flex-1">
              <p className="font-ui text-sm font-semibold text-ink">{label}</p>
              <p className="font-body text-xs italic text-muted">{desc}</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-muted flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Push notifications opt-in */}
      <div className="mb-4">
        <PushNotificationToggle />
      </div>

      <button
        onClick={logout}
        className="w-full border border-spice text-spice font-ui text-sm font-medium py-2.5 rounded-lg hover:bg-red-50 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}

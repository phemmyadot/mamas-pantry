"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Mum's Picks", href: "/mums-picks" },
  { label: "Pre-Order", href: "/pre-order" },
  { label: "Delivery", href: "/delivery" },
];

export default function StorefrontHeader() {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="bg-forest-deep sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="font-display text-xl font-bold text-cream leading-none">
            Mama<em className="italic text-gold-light">&apos;s</em> Pantry
          </span>
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-5">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = pathname === href.split("?")[0];
            return (
              <Link
                key={href}
                href={href}
                className={`font-ui text-sm font-medium transition-colors ${
                  isActive ? "text-gold-light" : "text-forest-pale hover:text-cream"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              href="/account"
              className="font-ui text-sm text-forest-pale hover:text-cream transition-colors hidden sm:block"
            >
              {user?.email?.split("@")[0] ?? "Account"}
            </Link>
          ) : (
            <Link
              href="/login"
              className="font-ui text-sm text-forest-pale hover:text-cream transition-colors hidden sm:block"
            >
              Sign in
            </Link>
          )}

          {/* Cart button */}
          <button
            onClick={openCart}
            aria-label={`Open cart, ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
            className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-forest-mid transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-5 h-5 text-cream"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gold text-forest-deep text-[10px] font-ui font-semibold rounded-full flex items-center justify-center leading-none">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

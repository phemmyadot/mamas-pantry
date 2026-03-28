import Link from "next/link";

export default function StorefrontFooter() {
  return (
    <footer className="bg-forest-deep text-forest-pale">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <p className="font-display text-2xl font-bold text-cream leading-none mb-2">
              Mama<em className="italic text-gold-light">&apos;s</em> Pantry
            </p>
            <p className="font-body text-sm italic text-forest-pale opacity-80 mb-4">
              Chosen with care. Stocked with love.
            </p>
            <address className="not-italic font-ui text-xs text-forest-pale opacity-70 leading-relaxed">
              Magodo Phase 1, Lagos
              <br />
              Nigeria
            </address>
          </div>

          {/* Links */}
          <div className="flex gap-12 sm:gap-16">
            <div>
              <p className="font-ui text-xs font-semibold uppercase tracking-widest text-gold mb-3">
                Shop
              </p>
              <ul className="space-y-2">
                {[
                  { label: "All products", href: "/shop" },
                  { label: "Special Picks", href: "/mums-picks" },
                  { label: "Local favourites", href: "/shop?category=local" },
                  { label: "Imported goods", href: "/shop?category=imported" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="font-ui text-sm text-forest-pale opacity-70 hover:opacity-100 hover:text-cream transition-all"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-ui text-xs font-semibold uppercase tracking-widest text-gold mb-3">
                Help
              </p>
              <ul className="space-y-2">
                {[
                  { label: "Delivery info", href: "/delivery" },
                  { label: "My account", href: "/account" },
                  { label: "My orders", href: "/account/orders" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="font-ui text-sm text-forest-pale opacity-70 hover:opacity-100 hover:text-cream transition-all"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-forest-mid flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-ui text-xs text-forest-pale opacity-50">
            &copy; {new Date().getFullYear()} Mama&apos;s Pantry. All rights reserved.
          </p>
          <p className="font-body text-xs italic text-forest-pale opacity-40">
            Fresh from the pantry to your door.
          </p>
        </div>
      </div>
    </footer>
  );
}

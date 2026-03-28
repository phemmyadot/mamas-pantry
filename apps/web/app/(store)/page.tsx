import Link from "next/link";
import type { Product } from "@/lib/api";
import ProductCard from "./_components/ProductCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products?limit=8`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getMumsPicks(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products?category=mums_pick&limit=4`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const CATEGORIES = [
  { label: "All", href: "/shop" },
  { label: "Mum's Picks", href: "/shop?category=mums_pick" },
  { label: "Local favourites", href: "/shop?category=local" },
  { label: "Imported goods", href: "/shop?category=imported" },
];

export default async function HomePage() {
  const [featured, mumsPicks] = await Promise.all([getFeaturedProducts(), getMumsPicks()]);

  return (
    <>
      {/* Hero */}
      <section className="bg-cream border-b border-cream-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1 text-center sm:text-left">
            <p className="font-body text-sm italic text-forest-light mb-3 tracking-wide">
              Magodo Phase 1, Lagos
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-forest-deep leading-tight mb-4">
              Your neighbourhood<br />
              <em className="italic text-forest-mid">pantry, delivered.</em>
            </h1>
            <p className="font-body text-base text-muted italic mb-8 max-w-sm mx-auto sm:mx-0">
              Chosen with care. Stocked with love. Fresh groceries from local and imported sources — right to your door.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              <Link
                href="/shop"
                className="bg-forest-deep text-cream font-ui font-medium text-sm px-6 py-3 rounded-lg hover:bg-forest-mid transition-colors text-center"
              >
                Shop now
              </Link>
              <Link
                href="/shop?category=mums_pick"
                className="border border-forest-deep text-forest-deep font-ui font-medium text-sm px-6 py-3 rounded-lg hover:bg-forest-mist transition-colors text-center"
              >
                Mum&apos;s Picks
              </Link>
            </div>
          </div>

          {/* Decorative panel */}
          <div className="hidden sm:flex flex-shrink-0 w-72 h-72 rounded-2xl bg-forest-deep items-center justify-center shadow-lg">
            <div className="text-center px-8">
              <p className="font-display text-3xl font-bold text-cream leading-tight mb-2">
                Mama<em className="italic text-gold-light">&apos;s</em> Pantry
              </p>
              <div className="w-10 h-px bg-gold mx-auto my-3 opacity-60" />
              <p className="font-body text-xs italic text-forest-pale opacity-80">
                Chosen with care.<br />Stocked with love.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="border-b border-cream-dark bg-white sticky top-14 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex-shrink-0 font-ui text-sm font-medium px-4 py-1.5 rounded-full border border-cream-dark bg-cream hover:bg-forest-deep hover:text-cream hover:border-forest-deep transition-colors text-ink"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {/* Mum's Picks highlight (if any) */}
        {mumsPicks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-forest-deep">
                  Mum&apos;s Picks
                </h2>
                <p className="font-body text-sm italic text-muted mt-0.5">
                  Hand-selected by Mama herself
                </p>
              </div>
              <Link
                href="/shop?category=mums_pick"
                className="font-ui text-sm text-forest-light hover:underline hidden sm:block"
              >
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {mumsPicks.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Just landed */}
        {featured.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-forest-deep">
                  Just landed
                </h2>
                <p className="font-body text-sm italic text-muted mt-0.5">
                  Fresh stock, ready to go
                </p>
              </div>
              <Link
                href="/shop"
                className="font-ui text-sm text-forest-light hover:underline hidden sm:block"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : (
          <section className="text-center py-16">
            <p className="font-display text-xl text-forest-deep mb-2">
              The pantry is being stocked…
            </p>
            <p className="font-body text-sm italic text-muted">Check back soon.</p>
          </section>
        )}

        {/* Delivery callout */}
        <section className="bg-forest-deep rounded-2xl px-6 sm:px-10 py-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-cream mb-2">
              Same-day delivery in Magodo Phase 1
            </h2>
            <p className="font-body text-sm italic text-forest-pale opacity-80">
              Order before 2 pm and we&apos;ll bring it right to your door.
            </p>
          </div>
          <Link
            href="/delivery"
            className="flex-shrink-0 border border-gold text-gold font-ui text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gold hover:text-forest-deep transition-colors"
          >
            Learn more
          </Link>
        </section>
      </div>
    </>
  );
}

import Link from "next/link";
import type { Product, Shipment } from "@/lib/api";
import ProductCard from "./_components/ProductCard";
import ShipmentCountdown from "./_components/ShipmentCountdown";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getMumsPicks(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products/featured`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function getLocalProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products?category=local&limit=4`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function getActiveShipment(): Promise<Shipment | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/shipments`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const all: Shipment[] = await res.json();
    return all.find((s) => s.status === "in_transit" || s.status === "upcoming") ?? null;
  } catch { return null; }
}

async function getCategoryCounts(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/categories`, { next: { revalidate: 120 } });
    if (!res.ok) return {};
    const data: { category: string; product_count: number }[] = await res.json();
    return Object.fromEntries(data.map((c) => [c.category, c.product_count]));
  } catch { return {}; }
}

const CATEGORIES = [
  { label: "Imported", value: "imported", emoji: "🌍", desc: "Straight from the USA" },
  { label: "Local", value: "local", emoji: "🌿", desc: "Nigerian favourites" },
  { label: "Chilled", value: "chilled", emoji: "❄️", desc: "Dairy, meats & more" },
  { label: "Household", value: "household", emoji: "🏠", desc: "Home essentials" },
];

const DELIVERY_ZONES = ["Magodo Phase 1", "Magodo Phase 2", "Alapere", "Ketu", "Ojota"];

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000));
}

export default async function HomePage() {
  const [mumsPicks, localProducts, activeShipment, categoryCounts] = await Promise.all([
    getMumsPicks(),
    getLocalProducts(),
    getActiveShipment(),
    getCategoryCounts(),
  ]);

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Mama's Pantry",
    description: "Hand-picked groceries — imported staples and local favourites — delivered to your gate, same day.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Magodo Phase 1",
      addressLocality: "Lagos",
      addressRegion: "Lagos State",
      addressCountry: "NG",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "18:00",
    },
    areaServed: DELIVERY_ZONES,
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mamaspantry.com",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      {/* Shipment teaser banner — show when arriving within 7 days or already in transit */}
      {activeShipment && (activeShipment.status === "in_transit" || daysUntil(activeShipment.arrival_date) <= 7) && (
        <div className="bg-gold text-forest-deep text-center py-2 px-4">
          <p className="font-ui text-sm font-semibold">
            {activeShipment.status === "in_transit"
              ? `✈️ Mum just landed — new stock arriving in ${daysUntil(activeShipment.arrival_date)} days`
              : `📦 Shipment from ${activeShipment.origin_country} arriving in ${daysUntil(activeShipment.arrival_date)} days`}
            {" · "}
            <Link href="/pre-order" className="underline hover:text-forest-mid">Pre-order now</Link>
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="bg-cream border-b border-cream-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1 text-center sm:text-left">
            <p className="font-body text-sm italic text-forest-light mb-3 tracking-wide">
              Magodo Phase 1, Lagos
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-forest-deep leading-tight mb-4">
              From our hands<br />
              <em className="italic text-forest-mid">to your table.</em>
            </h1>
            <p className="font-body text-base text-muted italic mb-8 max-w-sm mx-auto sm:mx-0">
              Hand-picked groceries — imported staples and local favourites — delivered to your gate, same day.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              <Link href="/shop" className="bg-forest-deep text-cream font-ui font-medium text-sm px-6 py-3 rounded-lg hover:bg-forest-mid transition-colors text-center">
                Shop now
              </Link>
              <Link href="/mums-picks" className="border border-forest-deep text-forest-deep font-ui font-medium text-sm px-6 py-3 rounded-lg hover:bg-forest-mist transition-colors text-center">
                Mum&apos;s Picks ✨
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex flex-shrink-0 w-72 h-72 rounded-2xl bg-forest-deep items-center justify-center shadow-lg">
            <div className="text-center px-8">
              <p className="font-display text-3xl font-bold text-cream leading-tight mb-2">
                Mama<em className="italic text-gold-light">&apos;s</em> Pantry
              </p>
              <div className="w-10 h-px bg-gold mx-auto my-3 opacity-60" />
              <p className="font-body text-xs italic text-forest-pale opacity-80">
                From our hands<br />to your table.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Shipment countdown — shown in hero area when shipment is upcoming (> 7 days out) */}
      {activeShipment && activeShipment.status !== "in_transit" && daysUntil(activeShipment.arrival_date) > 7 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <ShipmentCountdown
            name={activeShipment.name}
            originCountry={activeShipment.origin_country}
            arrivalDate={activeShipment.arrival_date}
            status={activeShipment.status}
          />
        </div>
      )}

      {/* 4-tile category grid */}
      <section className="bg-white border-b border-cream-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h2 className="font-display text-xl font-bold text-forest-deep mb-5">Browse by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(({ label, value, emoji, desc }) => (
              <Link
                key={value}
                href={`/shop?category=${value}`}
                className="flex flex-col items-center gap-2 bg-cream rounded-2xl border border-cream-dark p-5 hover:border-forest-light hover:bg-forest-mist transition-colors text-center"
              >
                <span className="text-3xl">{emoji}</span>
                <span className="font-ui text-sm font-semibold text-forest-deep">{label}</span>
                <span className="font-body text-xs italic text-muted">{desc}</span>
                {categoryCounts[value] != null && (
                  <span className="font-ui text-xs text-forest-light">
                    {categoryCounts[value]} item{categoryCounts[value] !== 1 ? "s" : ""}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* Mum's Picks horizontal scroll */}
        {mumsPicks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-forest-deep flex items-center gap-2">
                  Mum&apos;s Picks <span className="text-gold text-xl">✨</span>
                </h2>
                <p className="font-body text-sm italic text-muted mt-0.5">Hand-selected by Mama herself</p>
              </div>
              <Link href="/mums-picks" className="font-ui text-sm text-forest-light hover:underline hidden sm:block">
                View all →
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 lg:grid-cols-6">
              {mumsPicks.slice(0, 6).map((p) => (
                <div key={p.id} className="flex-shrink-0 w-44 sm:w-auto">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Local Staples strip */}
        {localProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-forest-deep">Local Staples 🌿</h2>
                <p className="font-body text-sm italic text-muted mt-0.5">Nigerian pantry favourites</p>
              </div>
              <Link href="/shop?category=local" className="font-ui text-sm text-forest-light hover:underline hidden sm:block">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {localProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="bg-cream rounded-2xl border border-cream-dark px-6 sm:px-10 py-10">
          <h2 className="font-display text-2xl font-bold text-forest-deep text-center mb-8">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: "🛒", title: "Browse", desc: "Pick from imported goods, local staples, chilled produce, and household items." },
              { icon: "📦", title: "Order", desc: "Place your order before 2 pm for same-day delivery." },
              { icon: "🚪", title: "Delivered to your gate", desc: "We bring it right to your door in Magodo and nearby areas." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-forest-deep flex items-center justify-center text-2xl shadow">
                  {icon}
                </div>
                <h3 className="font-ui text-base font-semibold text-forest-deep">{title}</h3>
                <p className="font-body text-sm italic text-muted max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Delivery zones */}
        <section className="bg-forest-deep rounded-2xl px-6 sm:px-10 py-10 flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-display text-xl font-bold text-cream mb-2">We deliver to your neighbourhood</h2>
            <p className="font-body text-sm italic text-forest-pale opacity-80 mb-4">
              Same-day before 2 pm. Next-day available on all orders.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {DELIVERY_ZONES.map((zone) => (
                <span key={zone} className="font-ui text-xs font-medium bg-forest-mid text-forest-pale px-3 py-1 rounded-full">
                  {zone}
                </span>
              ))}
            </div>
          </div>
          <Link href="/delivery" className="flex-shrink-0 border border-gold text-gold font-ui text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gold hover:text-forest-deep transition-colors">
            Delivery info →
          </Link>
        </section>
      </div>
    </>
  );
}

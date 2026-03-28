import Link from "next/link";
import type { Product, Shipment } from "@/lib/api";
import ProductCard from "../_components/ProductCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getMumsPicks(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products/featured`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function getNextShipment(): Promise<Shipment | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/shipments`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const all: Shipment[] = await res.json();
    return all.find((s) => s.status === "upcoming" || s.status === "in_transit") ?? null;
  } catch { return null; }
}

function daysUntil(dateStr: string) {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000));
}

export default async function MumsPicksPage() {
  const [picks, shipment] = await Promise.all([getMumsPicks(), getNextShipment()]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-forest-deep mb-3">
          Mum&apos;s Picks <span className="text-gold">✨</span>
        </h1>
        <p className="font-body text-base italic text-muted max-w-md mx-auto">
          Hand-selected by Mama herself. Every product on this page has been personally chosen for quality and value.
        </p>
      </div>

      {/* Shipment countdown widget */}
      {shipment && (
        <div className="bg-forest-deep rounded-2xl p-6 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-ui text-xs uppercase tracking-widest text-forest-pale opacity-70 mb-1">Next shipment</p>
            <p className="font-display text-xl font-bold text-cream">{shipment.name}</p>
            <p className="font-body text-sm italic text-forest-pale opacity-80 mt-0.5">
              From {shipment.origin_country} · arriving {new Date(shipment.arrival_date).toLocaleDateString("en-NG", { day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="font-display text-4xl font-bold text-gold">{daysUntil(shipment.arrival_date)}</p>
              <p className="font-ui text-xs text-forest-pale opacity-70">days away</p>
            </div>
            <Link
              href="/pre-order"
              className="bg-gold text-forest-deep font-ui text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors"
            >
              Pre-order →
            </Link>
          </div>
        </div>
      )}

      {picks.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-xl text-forest-deep mb-2">Mum is still curating…</p>
          <p className="font-body text-sm italic text-muted">Check back soon for hand-picked favourites.</p>
        </div>
      ) : (
        <>
          <p className="font-ui text-sm text-muted mb-6">{picks.length} curated item{picks.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {picks.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}

import type { Product, Shipment } from "@/lib/api";
import { API_BASE } from "@/lib/api";
import ProductCard from "../_components/ProductCard";
import ShipmentCountdown from "../_components/ShipmentCountdown";


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

export default async function MumsPicksPage() {
  const [picks, shipment] = await Promise.all([getMumsPicks(), getNextShipment()]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold text-forest-deep mb-3">
          Special Picks <span className="text-gold">✨</span>
        </h1>
        <p className="font-body text-base italic text-muted max-w-md mx-auto">
          Hand-selected by Mama herself. Every product on this page has been personally chosen for quality and value.
        </p>
      </div>

      {/* Shipment countdown widget */}
      {shipment && (
        <div className="mb-10">
          <ShipmentCountdown
            name={shipment.name}
            originCountry={shipment.origin_country}
            arrivalDate={shipment.arrival_date}
            status={shipment.status}
          />
        </div>
      )}

      {picks.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-xl text-forest-deep mb-2">Still curating…</p>
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

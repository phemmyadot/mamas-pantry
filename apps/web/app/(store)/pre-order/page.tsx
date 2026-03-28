"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { shipments, preOrders, type Shipment, type Product, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

function daysUntil(dateStr: string) {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000));
}

export default function PreOrderPage() {
  const { isAuthenticated } = useAuth();
  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    shipments.list().then((data) => {
      const active = data.filter((s) => s.status === "upcoming" || s.status === "in_transit");
      setAllShipments(active);
      if (active.length > 0) selectShipment(active[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function selectShipment(s: Shipment) {
    setSelectedShipment(s);
    setLoadingProducts(true);
    try {
      const prods = await shipments.products(s.id);
      setProducts(prods);
    } catch { setProducts([]); }
    setLoadingProducts(false);
  }

  async function handlePreOrder(productId: string) {
    if (!selectedShipment) return;
    setPlacingId(productId);
    setError(null);
    try {
      await preOrders.create(productId, selectedShipment.id, 1);
      setSuccess("Pre-order placed! We'll confirm when the shipment arrives.");
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "Failed to place pre-order.");
    }
    setPlacingId(null);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse font-ui text-sm text-muted">Loading shipments…</div>
      </div>
    );
  }

  if (allShipments.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">📦</div>
        <h1 className="font-display text-2xl font-bold text-forest-deep mb-2">No upcoming shipments</h1>
        <p className="font-body text-sm italic text-muted mb-6">
          Check back soon — Mum is always restocking.
        </p>
        <Link href="/shop" className="bg-forest-deep text-cream font-ui text-sm font-medium px-6 py-3 rounded-lg hover:bg-forest-mid transition-colors inline-block">
          Browse what&apos;s in stock →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-deep">Pre-order</h1>
        <p className="font-body text-sm italic text-muted mt-1">
          Reserve imported products from the next shipment before they sell out.
        </p>
      </div>

      {success && (
        <div className="bg-forest-mist border border-forest-light rounded-xl px-4 py-3 mb-6 font-ui text-sm text-forest-deep">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 font-ui text-sm text-spice">
          {error}
        </div>
      )}

      {/* Shipment selector */}
      {allShipments.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none">
          {allShipments.map((s) => (
            <button
              key={s.id}
              onClick={() => selectShipment(s)}
              className={`flex-shrink-0 font-ui text-sm font-medium px-4 py-2 rounded-full border transition-colors ${
                selectedShipment?.id === s.id
                  ? "bg-forest-deep text-cream border-forest-deep"
                  : "bg-white text-ink border-cream-dark hover:bg-forest-mist"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Selected shipment card */}
      {selectedShipment && (
        <div className="bg-forest-deep rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold text-cream">{selectedShipment.name}</p>
            <p className="font-body text-sm italic text-forest-pale opacity-80 mt-0.5">
              From {selectedShipment.origin_country} · arriving {new Date(selectedShipment.arrival_date).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="font-display text-3xl font-bold text-gold">{daysUntil(selectedShipment.arrival_date)}</p>
            <p className="font-ui text-xs text-forest-pale opacity-70">days away</p>
          </div>
        </div>
      )}

      {/* Products */}
      {loadingProducts ? (
        <div className="text-center py-10 font-ui text-sm text-muted animate-pulse">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10">
          <p className="font-body text-sm italic text-muted">No products listed for this shipment yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-cream-dark overflow-hidden flex flex-col">
              <Link href={`/shop/${p.slug}`} className="block aspect-[4/3] bg-forest-mist overflow-hidden">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>
                )}
              </Link>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <p className="font-ui text-sm font-medium text-ink line-clamp-2">{p.name}</p>
                {p.origin && <p className="font-body text-xs italic text-muted">From {p.origin}</p>}
                <p className="font-ui text-base font-semibold text-forest-mid mt-auto">{formatNGN(p.price_ngn)}</p>
                {isAuthenticated ? (
                  <button
                    onClick={() => handlePreOrder(p.id)}
                    disabled={placingId === p.id}
                    className="w-full bg-forest-deep text-cream font-ui text-sm font-medium py-2 rounded-lg hover:bg-forest-mid transition-colors disabled:opacity-60"
                  >
                    {placingId === p.id ? "Placing…" : "Pre-order"}
                  </button>
                ) : (
                  <Link href="/login" className="block w-full text-center bg-cream-dark text-ink font-ui text-sm font-medium py-2 rounded-lg hover:bg-cream transition-colors">
                    Sign in to pre-order
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { orders, type Order, ApiError } from "@/lib/api";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:          { label: "Pending",           color: "bg-amber-100 text-amber-800" },
  confirmed:        { label: "Confirmed",         color: "bg-blue-100 text-blue-800" },
  packed:           { label: "Packed",            color: "bg-indigo-100 text-indigo-800" },
  ready_for_pickup: { label: "Ready for pickup",  color: "bg-cyan-100 text-cyan-800" },
  out_for_delivery: { label: "Out for delivery",  color: "bg-purple-100 text-purple-800" },
  delivered:        { label: "Delivered",         color: "bg-forest-mist text-forest-deep" },
  cancelled:        { label: "Cancelled",         color: "bg-red-100 text-red-700" },
};

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

export default function OrdersPage() {
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    orders.myOrders().then(setOrderList).catch((e: unknown) => {
      setError(e instanceof ApiError ? e.detail : "Failed to load orders.");
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center font-ui text-sm text-muted animate-pulse">
      Loading orders…
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="font-ui text-sm text-spice">{error}</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold text-forest-deep mb-6">My orders</h1>

      {orderList.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <p className="font-display text-xl text-forest-deep mb-2">No orders yet</p>
          <p className="font-body text-sm italic text-muted mb-6">Once you place an order, it will appear here.</p>
          <Link href="/shop" className="bg-forest-deep text-cream font-ui text-sm font-medium px-6 py-3 rounded-lg hover:bg-forest-mid transition-colors inline-block">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orderList.map((o) => {
            const s = STATUS_LABELS[o.status] ?? { label: o.status, color: "bg-cream-dark text-muted" };
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="block bg-white rounded-2xl border border-cream-dark p-4 hover:border-forest-light hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-ui text-xs text-muted mb-1">
                      {new Date(o.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="font-ui text-sm font-medium text-ink">
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                      {o.items.length > 0 && ` · ${o.items[0].product_name}${o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-ui text-base font-bold text-forest-deep">{formatNGN(o.total_ngn)}</p>
                    <span className={`inline-block font-ui text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { preOrders, type PreOrder } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800",
  confirmed: "bg-forest-mist text-forest-deep",
  cancelled: "bg-red-100 text-red-700",
};

export default function AccountPreOrdersPage() {
  const [list, setList] = useState<PreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    preOrders.mine().then(setList).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account" className="font-ui text-sm text-forest-light hover:underline">← Account</Link>
        <span className="text-muted">/</span>
        <h1 className="font-display text-2xl font-bold text-forest-deep">Pre-orders</h1>
      </div>

      {loading ? (
        <div className="text-center py-16 font-ui text-sm text-muted animate-pulse">Loading…</div>
      ) : list.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">✈️</div>
          <p className="font-display text-xl text-forest-deep mb-2">No pre-orders yet</p>
          <p className="font-body text-sm italic text-muted mb-6">
            Reserve imported products from our next US shipment before they arrive.
          </p>
          <Link href="/pre-order" className="bg-forest-deep text-cream font-ui text-sm font-medium px-6 py-3 rounded-lg hover:bg-forest-mid transition-colors inline-block">
            Browse pre-orders →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((po) => (
            <div key={po.id} className="bg-white rounded-2xl border border-cream-dark p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-ui text-xs text-muted mb-1">Pre-order #{po.id.slice(0, 8)}</p>
                  <p className="font-ui text-sm font-medium text-ink">Qty: {po.quantity}</p>
                  <p className="font-ui text-xs text-muted">Shipment: {po.shipment_id.slice(0, 8)}…</p>
                </div>
                <span className={`font-ui text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[po.status] ?? "bg-cream-dark text-muted"}`}>
                  {po.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

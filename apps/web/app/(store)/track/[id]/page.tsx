"use client";

import { use, useState } from "react";
import { apiFetch, type Order, ApiError } from "@/lib/api";

const DELIVERY_STATUS_STEPS = ["pending", "confirmed", "packed", "out_for_delivery", "delivered"] as const;
const PICKUP_STATUS_STEPS = ["pending", "confirmed", "packed", "ready_for_pickup", "delivered"] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", packed: "Packed",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled",
};

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

export default function TrackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Public tracking: verify by order ID — backend will check phone matches delivery_address.phone
      const data = await apiFetch<Order>(`/api/v1/orders/track/${id}?phone=${encodeURIComponent(phone)}`);
      setOrder(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Order not found. Check your order ID and phone number.");
    }
    setLoading(false);
  }

  const statusSteps = order?.delivery_address?.fulfillment_type === "pickup" ? PICKUP_STATUS_STEPS : DELIVERY_STATUS_STEPS;
  const stepIndex = order ? statusSteps.indexOf(order.status as typeof statusSteps[number]) : -1;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-forest-deep mb-2">Track your order</h1>
      <p className="font-body text-sm italic text-muted mb-8">
        Enter the phone number you used when placing the order.
      </p>

      {!order && (
        <form onSubmit={handleTrack} className="space-y-4 mb-8">
          <div>
            <label className="block font-ui text-sm font-medium text-ink mb-1">Order ID</label>
            <input
              type="text"
              value={id}
              readOnly
              className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream-dark text-muted font-ui text-sm"
            />
          </div>
          <div>
            <label className="block font-ui text-sm font-medium text-ink mb-1">Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0812 345 6789"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
          </div>
          {error && <p className="font-ui text-sm text-spice">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-deep text-cream font-ui font-medium text-sm py-3 rounded-lg hover:bg-forest-mid transition-colors disabled:opacity-60"
          >
            {loading ? "Tracking…" : "Track order"}
          </button>
        </form>
      )}

      {order && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-forest-deep">
              {STATUS_LABELS[order.status] ?? order.status}
            </h2>
            <button onClick={() => setOrder(null)} className="font-ui text-xs text-forest-light hover:underline">
              Track another
            </button>
          </div>

          {/* Timeline */}
          {order.status !== "cancelled" && (
            <div className="bg-cream rounded-2xl border border-cream-dark p-5">
              <div className="flex justify-between">
                {statusSteps.map((step, i) => {
                  const done = i <= stepIndex;
                  const active = i === stepIndex;
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done ? "bg-forest-deep border-forest-deep text-cream" : "bg-white border-cream-dark text-muted"} ${active ? "ring-2 ring-forest-light ring-offset-1" : ""}`}>
                        {done && !active ? "✓" : i + 1}
                      </div>
                      <span className={`font-ui text-[9px] text-center leading-tight ${active ? "font-semibold text-forest-deep" : "text-muted"}`}>
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-cream-dark p-5 space-y-2">
            <div className="flex justify-between font-ui text-sm">
              <span className="text-muted">Delivering to</span>
              <span className="text-ink font-medium text-right max-w-[200px]">{order.delivery_address.address}, {order.delivery_address.city}</span>
            </div>
            <div className="flex justify-between font-ui text-sm">
              <span className="text-muted">Total paid</span>
              <span className="text-forest-deep font-bold">{formatNGN(order.total_ngn)}</span>
            </div>
            <div className="flex justify-between font-ui text-sm">
              <span className="text-muted">Payment</span>
              <span className="text-ink capitalize">{order.payment_status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

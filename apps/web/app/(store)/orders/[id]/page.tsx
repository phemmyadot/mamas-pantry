"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { orders, type Order, ApiError } from "@/lib/api";

const STATUS_STEPS = ["pending", "confirmed", "packed", "out_for_delivery", "delivered"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  unpaid:  { label: "Payment pending", color: "bg-amber-100 text-amber-800" },
  paid:    { label: "Paid",            color: "bg-forest-mist text-forest-deep" },
  failed:  { label: "Payment failed",  color: "bg-red-100 text-red-700" },
};

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    orders.myOrder(id).then(setOrder).catch((e: unknown) => {
      setError(e instanceof ApiError ? e.detail : "Order not found.");
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-16 text-center font-ui text-sm text-muted animate-pulse">Loading…</div>;
  if (error || !order) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p className="font-ui text-sm text-spice mb-4">{error || "Order not found."}</p>
      <Link href="/orders" className="font-ui text-sm text-forest-light hover:underline">← Back to orders</Link>
    </div>
  );

  const stepIndex = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
  const isCancelled = order.status === "cancelled";
  const payment = PAYMENT_LABELS[order.payment_status] ?? { label: order.payment_status, color: "bg-cream-dark text-muted" };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/orders" className="font-ui text-sm text-forest-light hover:underline mb-4 inline-block">
        ← Back to orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest-deep">Order detail</h1>
          <p className="font-ui text-xs text-muted mt-1">
            Placed {new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className={`font-ui text-xs font-semibold px-3 py-1 rounded-full ${payment.color}`}>
          {payment.label}
        </span>
      </div>

      {/* Status timeline */}
      {!isCancelled && (
        <div className="bg-cream rounded-2xl border border-cream-dark p-5 mb-6">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= stepIndex;
              const active = i === stepIndex;
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    done ? "bg-forest-deep border-forest-deep text-cream" : "bg-white border-cream-dark text-muted"
                  } ${active ? "ring-2 ring-forest-light ring-offset-1" : ""}`}>
                    {done && !active ? "✓" : i + 1}
                  </div>
                  <span className={`font-ui text-[10px] text-center leading-tight ${active ? "text-forest-deep font-semibold" : "text-muted"}`}>
                    {STATUS_LABELS[step]}
                  </span>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`absolute h-0.5 ${done ? "bg-forest-deep" : "bg-cream-dark"}`} style={{ width: "calc(100% / 5)", top: "16px", left: "50%", position: "relative", marginTop: "-24px" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 font-ui text-sm text-red-700">
          This order was cancelled.
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl border border-cream-dark p-5 mb-4 space-y-3">
        <h2 className="font-display text-base font-bold text-forest-deep mb-3">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2">
            <p className="font-ui text-sm text-ink flex-1">{item.product_name}</p>
            <p className="font-ui text-xs text-muted">× {item.qty}</p>
            <p className="font-ui text-sm font-semibold text-forest-mid">{formatNGN(item.unit_price_ngn * item.qty)}</p>
          </div>
        ))}
        <div className="border-t border-cream-dark pt-3 space-y-1.5">
          <div className="flex justify-between font-ui text-sm text-muted">
            <span>Subtotal</span><span>{formatNGN(order.subtotal_ngn)}</span>
          </div>
          <div className="flex justify-between font-ui text-sm text-muted">
            <span>Delivery fee</span><span>{formatNGN(order.delivery_fee_ngn)}</span>
          </div>
          <div className="flex justify-between font-ui text-base font-bold text-forest-deep pt-1">
            <span>Total</span><span>{formatNGN(order.total_ngn)}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div className="bg-white rounded-2xl border border-cream-dark p-5">
        <h2 className="font-display text-base font-bold text-forest-deep mb-3">Delivery address</h2>
        <p className="font-ui text-sm text-ink">{order.delivery_address.name}</p>
        <p className="font-ui text-sm text-muted">{order.delivery_address.address}</p>
        <p className="font-ui text-sm text-muted">{order.delivery_address.city}</p>
        <p className="font-ui text-sm text-muted">{order.delivery_address.phone}</p>
      </div>

      {order.notes && (
        <div className="mt-4 bg-cream rounded-xl border border-cream-dark p-4">
          <p className="font-ui text-xs font-medium text-muted mb-1">Notes</p>
          <p className="font-body text-sm italic text-ink">{order.notes}</p>
        </div>
      )}
    </div>
  );
}

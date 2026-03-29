"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { orders, type Order } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  pending: "Order received",
  packed: "Being packed",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; paid?: string }>;
}) {
  const { order: orderId, paid } = use(searchParams);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      if (paid === "1") {
        try { await orders.confirmPayment(orderId); } catch { /* best-effort */ }
      }
      try {
        setOrder(await orders.myOrder(orderId));
      } catch {
        // order not found
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId, paid]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="font-body text-sm italic text-muted animate-pulse">Loading your order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="font-display text-xl text-forest-deep mb-2">Order not found</p>
        <Link href="/" className="font-ui text-sm text-forest-light hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-forest-mist flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-8 h-8 text-forest-light"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-forest-deep mb-1">
          Order confirmed!
        </h1>
        <p className="font-body text-sm italic text-muted">
          Thank you. We&apos;ll start preparing your order right away.
        </p>
      </div>

      {/* Order card */}
      <div className="bg-white rounded-2xl border border-cream-dark p-5 space-y-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-ui text-muted">Order #</span>
          <span className="font-ui font-medium text-ink">{order.id.slice(0, 8).toUpperCase()}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-ui text-muted">Status</span>
          <span className="font-ui font-medium text-forest-mid">
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-ui text-muted">Delivery to</span>
          <span className="font-ui font-medium text-ink text-right max-w-[60%]">
            {order.delivery_address.address}, {order.delivery_address.city}
          </span>
        </div>

        <div className="border-t border-cream-dark pt-4 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="font-ui text-ink">
                {item.product_name}{" "}
                <span className="text-muted">× {item.qty}</span>
              </span>
              <span className="font-ui font-medium text-forest-mid">
                {new Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                  minimumFractionDigits: 0,
                }).format(item.unit_price_ngn * item.qty)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-cream-dark pt-3 flex justify-between">
          <span className="font-ui text-sm text-muted">Total</span>
          <span className="font-ui text-base font-bold text-forest-deep">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
              minimumFractionDigits: 0,
            }).format(order.total_ngn)}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href="/account/orders"
          className="flex-1 bg-forest-deep text-cream font-ui text-sm font-medium py-3 rounded-lg hover:bg-forest-mid transition-colors text-center"
        >
          View my orders
        </Link>
        <Link
          href="/shop"
          className="flex-1 border border-forest-deep text-forest-deep font-ui text-sm font-medium py-3 rounded-lg hover:bg-forest-mist transition-colors text-center"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

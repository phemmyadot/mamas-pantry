"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { orders, type DeliveryAddress } from "@/lib/api";

function formatNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();

  const [form, setForm] = useState<DeliveryAddress>({
    name: "",
    phone: "",
    address: "",
    city: "Lagos",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setError("");
    setPending(true);
    try {
      const order = await orders.create(
        items.map((i) => ({ product_id: i.product.id, qty: i.qty })),
        form
      );
      clearCart();
      router.push(`/checkout/confirmation?order=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="font-display text-xl text-forest-deep mb-2">Your cart is empty</p>
        <p className="font-body text-sm italic text-muted mb-6">
          Add some items before checking out.
        </p>
        <Link
          href="/shop"
          className="bg-forest-deep text-cream font-ui text-sm font-medium px-6 py-3 rounded-lg hover:bg-forest-mid transition-colors"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold text-forest-deep mb-8">Checkout</h1>

      <div className="grid sm:grid-cols-[1fr_360px] gap-8">
        {/* Delivery form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="font-display text-lg font-bold text-forest-deep">Delivery details</h2>

          <div>
            <label className="block font-ui text-sm font-medium text-ink mb-1">Full name</label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Adaeze Okafor"
              className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-ink font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
          </div>

          <div>
            <label className="block font-ui text-sm font-medium text-ink mb-1">Phone number</label>
            <input
              name="phone"
              type="tel"
              required
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 0812 345 6789"
              className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-ink font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
          </div>

          <div>
            <label className="block font-ui text-sm font-medium text-ink mb-1">
              Delivery address
            </label>
            <input
              name="address"
              type="text"
              required
              value={form.address}
              onChange={handleChange}
              placeholder="Street address, house number"
              className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-ink font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
          </div>

          <div>
            <label className="block font-ui text-sm font-medium text-ink mb-1">City</label>
            <input
              name="city"
              type="text"
              required
              value={form.city}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream text-ink font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
          </div>

          <p className="font-body text-xs italic text-muted">
            We currently deliver within Magodo Phase 1, Lagos only.
          </p>

          {error && <p className="font-ui text-sm text-spice">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-forest-deep text-cream font-ui font-medium text-sm py-3 rounded-lg hover:bg-forest-mid transition-colors disabled:opacity-60"
          >
            {pending ? "Placing order…" : `Place order · ${formatNGN(totalPrice)}`}
          </button>
        </form>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-cream-dark p-5 h-fit">
          <h2 className="font-display text-lg font-bold text-forest-deep mb-4">Order summary</h2>
          <div className="space-y-3 mb-4">
            {items.map(({ product, qty }) => (
              <div key={product.id} className="flex gap-3 items-start">
                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-forest-mist flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">🛒</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-sm font-medium text-ink line-clamp-1">{product.name}</p>
                  <p className="font-ui text-xs text-muted">Qty: {qty}</p>
                </div>
                <p className="font-ui text-sm font-semibold text-forest-mid flex-shrink-0">
                  {formatNGN(product.price_ngn * qty)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-cream-dark pt-3 flex items-center justify-between">
            <span className="font-ui text-sm text-muted">Subtotal</span>
            <span className="font-ui text-base font-bold text-forest-deep">
              {formatNGN(totalPrice)}
            </span>
          </div>
          <p className="font-body text-xs italic text-muted mt-2">
            + delivery fee (collected on delivery)
          </p>
        </div>
      </div>
    </div>
  );
}

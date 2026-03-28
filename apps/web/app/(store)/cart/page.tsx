"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

const DELIVERY_FEE = 500;

export default function CartPage() {
  const { items, totalPrice, updateQty, removeItem } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <p className="font-display text-xl text-forest-deep mb-2">Your cart is empty</p>
        <p className="font-body text-sm italic text-muted mb-6">Browse our products and add something you love.</p>
        <Link href="/shop" className="bg-forest-deep text-cream font-ui text-sm font-medium px-6 py-3 rounded-lg hover:bg-forest-mid transition-colors inline-block">
          Browse products
        </Link>
      </div>
    );
  }

  const total = totalPrice + DELIVERY_FEE;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl font-bold text-forest-deep mb-8">Your cart</h1>

      <div className="grid sm:grid-cols-[1fr_340px] gap-8">
        {/* Line items */}
        <div className="space-y-3">
          {items.map(({ product, qty }) => (
            <div key={product.id} className="flex gap-4 items-center bg-white rounded-2xl border border-cream-dark p-4">
              <div className="w-16 h-16 flex-shrink-0 rounded-xl bg-forest-mist overflow-hidden">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/shop/${product.slug}`} className="font-ui text-sm font-medium text-ink line-clamp-1 hover:text-forest-mid">
                  {product.name}
                </Link>
                <p className="font-ui text-sm font-semibold text-forest-mid mt-0.5">{formatNGN(product.price_ngn)}</p>
              </div>
              {/* Qty */}
              <div className="flex items-center border border-cream-dark rounded-lg overflow-hidden">
                <button onClick={() => qty > 1 ? updateQty(product.id, qty - 1) : removeItem(product.id)} className="w-8 h-8 flex items-center justify-center text-ink hover:bg-cream-dark transition-colors text-lg">−</button>
                <span className="w-8 text-center font-ui text-sm">{qty}</span>
                <button onClick={() => updateQty(product.id, qty + 1)} disabled={qty >= product.stock_qty} className="w-8 h-8 flex items-center justify-center text-ink hover:bg-cream-dark transition-colors text-lg disabled:opacity-30">+</button>
              </div>
              <p className="font-ui text-sm font-semibold text-forest-deep w-20 text-right">{formatNGN(product.price_ngn * qty)}</p>
              <button onClick={() => removeItem(product.id)} aria-label="Remove" className="text-muted hover:text-spice transition-colors ml-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-cream-dark p-5 h-fit space-y-4">
          <h2 className="font-display text-lg font-bold text-forest-deep">Order summary</h2>

          {/* Promo code */}
          <div>
            <label className="block font-ui text-xs font-medium text-muted mb-1">Promo code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                disabled={promoApplied}
                className="flex-1 px-3 py-2 rounded-lg border border-cream-dark bg-cream font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light disabled:opacity-50"
              />
              <button
                onClick={() => promoCode.trim() && setPromoApplied(true)}
                disabled={promoApplied || !promoCode.trim()}
                className="bg-forest-deep text-cream font-ui text-xs font-medium px-3 py-2 rounded-lg hover:bg-forest-mid disabled:opacity-40 transition-colors"
              >
                {promoApplied ? "Applied ✓" : "Apply"}
              </button>
            </div>
            <p className="font-body text-xs italic text-muted mt-1">
              Discount applied at checkout
            </p>
          </div>

          <div className="border-t border-cream-dark pt-3 space-y-2">
            <div className="flex justify-between font-ui text-sm text-muted">
              <span>Subtotal</span><span>{formatNGN(totalPrice)}</span>
            </div>
            <div className="flex justify-between font-ui text-sm text-muted">
              <span>Delivery fee</span><span>{formatNGN(DELIVERY_FEE)}</span>
            </div>
            <div className="flex justify-between font-ui text-base font-bold text-forest-deep pt-2 border-t border-cream-dark">
              <span>Total</span><span>{formatNGN(total)}</span>
            </div>
          </div>

          <Link
            href={promoApplied ? `/checkout?promo=${promoCode}` : "/checkout"}
            className="block w-full bg-forest-deep text-cream font-ui font-medium text-sm py-3 rounded-lg hover:bg-forest-mid transition-colors text-center"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

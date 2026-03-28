"use client";

import { useState } from "react";
import type { Product } from "@/lib/api";
import { useCart } from "@/lib/cart-context";

function formatNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount);
}

export default function AddToCartSection({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stock_qty === 0;

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    openCart();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-3">
        <p className="font-display text-3xl font-bold text-forest-mid">{formatNGN(product.price_ngn)}</p>
        {product.compare_price_ngn && product.compare_price_ngn > product.price_ngn && (
          <p className="font-ui text-lg text-muted line-through">{formatNGN(product.compare_price_ngn)}</p>
        )}
      </div>

      {!isOutOfStock && product.stock_qty <= 5 && (
        <p className="font-ui text-sm text-spice font-medium">Only {product.stock_qty} left in stock</p>
      )}
      {isOutOfStock && <p className="font-ui text-sm text-muted font-medium">Currently out of stock</p>}

      {!isOutOfStock && (
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-cream-dark rounded-lg overflow-hidden">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease" className="w-10 h-10 flex items-center justify-center text-lg text-ink hover:bg-cream-dark transition-colors disabled:opacity-40">−</button>
            <span className="w-10 text-center font-ui text-sm font-medium">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(product.stock_qty, q + 1))} disabled={qty >= product.stock_qty} aria-label="Increase" className="w-10 h-10 flex items-center justify-center text-lg text-ink hover:bg-cream-dark transition-colors disabled:opacity-40">+</button>
          </div>
          <span className="font-ui text-sm text-muted">Total: {formatNGN(product.price_ngn * qty)}</span>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={isOutOfStock}
        className={`w-full sm:w-auto px-8 py-3 rounded-lg font-ui font-medium text-sm transition-all ${added ? "bg-forest-light text-white" : "bg-forest-deep text-cream hover:bg-forest-mid"} disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {added ? "Added to cart ✓" : isOutOfStock ? "Out of stock" : "Add to cart"}
      </button>
    </div>
  );
}

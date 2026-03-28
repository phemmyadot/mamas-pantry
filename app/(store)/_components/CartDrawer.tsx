"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

function formatNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function CartDrawer() {
  const { items, totalItems, totalPrice, updateQty, removeItem, closeCart, isCartOpen } =
    useCart();

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isCartOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isCartOpen, closeCart]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300 ${
          isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-cream shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
          <h2 className="font-display text-lg font-bold text-forest-deep">
            Your cart
            {totalItems > 0 && (
              <span className="ml-2 font-ui text-sm font-normal text-muted">
                ({totalItems} item{totalItems !== 1 ? "s" : ""})
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-dark transition-colors text-muted hover:text-ink"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-12 h-12 text-forest-pale"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              <p className="font-body text-sm italic text-muted">Your basket is empty.</p>
              <button
                onClick={closeCart}
                className="font-ui text-sm font-medium text-forest-light hover:underline"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            items.map(({ product, qty }) => (
              <div
                key={product.id}
                className="flex gap-3 bg-white rounded-xl p-3 border border-cream-dark"
              >
                {/* Product image placeholder */}
                <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-forest-mist flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🛒</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-ui text-sm font-medium text-ink leading-tight line-clamp-2">
                    {product.name}
                  </p>
                  <p className="font-ui text-sm font-semibold text-forest-mid mt-0.5">
                    {formatNGN(product.price_ngn)}
                  </p>

                  {/* Qty stepper */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(product.id, qty - 1)}
                      aria-label="Decrease quantity"
                      className="w-6 h-6 rounded-full border border-cream-dark flex items-center justify-center text-ink hover:bg-cream-dark transition-colors text-xs"
                    >
                      −
                    </button>
                    <span className="font-ui text-sm w-5 text-center">{qty}</span>
                    <button
                      onClick={() => updateQty(product.id, qty + 1)}
                      disabled={qty >= product.stock_qty}
                      aria-label="Increase quantity"
                      className="w-6 h-6 rounded-full border border-cream-dark flex items-center justify-center text-ink hover:bg-cream-dark transition-colors text-xs disabled:opacity-40"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(product.id)}
                      aria-label="Remove item"
                      className="ml-auto text-muted hover:text-spice transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-cream-dark space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-ui text-sm text-muted">Subtotal</span>
              <span className="font-ui text-base font-semibold text-forest-deep">
                {formatNGN(totalPrice)}
              </span>
            </div>
            <p className="font-body text-xs italic text-muted">
              Delivery fee calculated at checkout.
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-forest-deep text-cream font-ui font-medium text-sm text-center py-3 rounded-lg hover:bg-forest-mid transition-colors"
            >
              Proceed to checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

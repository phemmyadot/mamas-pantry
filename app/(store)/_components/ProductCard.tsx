"use client";

import Link from "next/link";
import type { Product } from "@/lib/api";
import { useCart } from "@/lib/cart-context";

const CATEGORY_LABELS: Record<string, string> = {
  mums_pick: "Mum's Pick",
  local: "Local",
  imported: "Imported",
};

const BADGE_COLORS: Record<string, string> = {
  mums_pick: "bg-gold text-amber-900",
  local: "bg-forest-light text-forest-deep",
  imported: "bg-forest-pale text-forest-deep",
};

function formatNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();

  function handleAdd() {
    addItem(product, 1);
    openCart();
  }

  const isOutOfStock = product.stock_qty === 0;
  const badgeLabel = product.badge ?? CATEGORY_LABELS[product.category];
  const badgeColor = BADGE_COLORS[product.category] ?? "bg-forest-pale text-forest-deep";

  return (
    <div className="group bg-white rounded-2xl border border-cream-dark overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="block relative aspect-[4/3] bg-forest-mist overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none">
            🛒
          </div>
        )}
        {/* Badge */}
        {badgeLabel && (
          <span className={`absolute top-2 left-2 text-[10px] font-ui font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${badgeColor}`}>
            {badgeLabel}
          </span>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-ink/30 flex items-center justify-center">
            <span className="font-ui text-xs font-semibold text-white bg-ink/60 px-2 py-1 rounded-full">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-ui text-sm font-medium text-ink leading-snug line-clamp-2 hover:text-forest-mid transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="font-ui text-base font-semibold text-forest-mid mt-auto">
          {formatNGN(product.price_ngn)}
        </p>
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className="w-full bg-forest-deep text-cream font-ui text-sm font-medium py-2 rounded-lg hover:bg-forest-mid transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isOutOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}

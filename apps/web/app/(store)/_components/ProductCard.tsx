"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { track, Events } from "@/lib/analytics";

const CATEGORY_LABELS: Record<string, string> = {
  imported: "Imported",
  local: "Local",
  chilled: "Chilled",
  household: "Household",
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
    track(Events.ADD_TO_CART, {
      product_id: product.id,
      product_name: product.name,
      price_ngn: product.price_ngn,
      category: product.category,
    });
  }

  const isOutOfStock = product.stock_qty === 0;
  const href = `/shop/${product.slug}`;

  return (
    <div className="group bg-white rounded-2xl border border-cream-dark overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Image */}
      <Link href={href} className="block relative aspect-[4/3] bg-forest-mist overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl select-none">
            🛒
          </div>
        )}

        {/* Special Pick badge (gold, top-left) */}
        {product.is_mums_pick && (
          <span className="absolute top-2 left-2 text-[10px] font-ui font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-gold text-amber-900">
            Special Pick ✨
          </span>
        )}

        {/* Category badge when no mums_pick */}
        {!product.is_mums_pick && product.badge && (
          <span className="absolute top-2 left-2 text-[10px] font-ui font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-forest-pale text-forest-deep">
            {product.badge}
          </span>
        )}

        {!product.is_mums_pick && !product.badge && (
          <span className="absolute top-2 left-2 text-[10px] font-ui font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide bg-forest-mist text-forest-mid">
            {CATEGORY_LABELS[product.category] ?? product.category}
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
        <Link href={href}>
          <h3 className="font-ui text-sm font-medium text-ink leading-snug line-clamp-2 hover:text-forest-mid transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.origin && (
          <p className="font-body text-xs italic text-muted">From {product.origin}</p>
        )}
        <div className="flex items-baseline gap-2 mt-auto">
          <p className="font-ui text-base font-semibold text-forest-mid">
            {formatNGN(product.price_ngn)}
          </p>
          {product.compare_price_ngn && product.compare_price_ngn > product.price_ngn && (
            <p className="font-ui text-xs text-muted line-through">
              {formatNGN(product.compare_price_ngn)}
            </p>
          )}
        </div>
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

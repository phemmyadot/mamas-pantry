import { notFound } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/api";
import AddToCartSection from "./_components/AddToCartSection";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const CATEGORY_LABELS: Record<string, string> = {
  mums_pick: "Mum's Pick",
  local: "Local",
  imported: "Imported",
};

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product || !product.is_active) notFound();

  const categoryLabel = CATEGORY_LABELS[product.category] ?? product.category;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-ui text-muted mb-6">
        <Link href="/" className="hover:text-forest-mid transition-colors">
          Home
        </Link>
        <span>›</span>
        <Link href="/shop" className="hover:text-forest-mid transition-colors">
          Shop
        </Link>
        <span>›</span>
        <Link
          href={`/shop?category=${product.category}`}
          className="hover:text-forest-mid transition-colors"
        >
          {categoryLabel}
        </Link>
        <span>›</span>
        <span className="text-ink truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid sm:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="aspect-square rounded-2xl bg-forest-mist overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-7xl select-none">🛒</span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          {/* Category badge */}
          <div>
            <span className="inline-block font-ui text-xs font-semibold uppercase tracking-wider bg-forest-mist text-forest-mid px-3 py-1 rounded-full">
              {categoryLabel}
            </span>
            {product.badge && product.badge !== categoryLabel && (
              <span className="ml-2 inline-block font-ui text-xs font-semibold uppercase tracking-wider bg-gold text-amber-900 px-3 py-1 rounded-full">
                {product.badge}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl font-bold text-forest-deep leading-snug">
            {product.name}
          </h1>

          {product.description && (
            <p className="font-body text-base text-muted leading-relaxed">
              {product.description}
            </p>
          )}

          <AddToCartSection product={product} />

          {/* Delivery note */}
          <div className="pt-4 border-t border-cream-dark">
            <p className="font-body text-sm italic text-muted">
              Same-day delivery available in Magodo Phase 1, Lagos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

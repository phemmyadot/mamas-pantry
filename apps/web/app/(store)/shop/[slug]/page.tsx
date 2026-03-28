import { notFound } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/api";
import AddToCartSection from "./_components/AddToCartSection";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const CATEGORY_LABELS: Record<string, string> = {
  imported: "Imported",
  local: "Local",
  chilled: "Chilled",
  household: "Household",
};

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products/${slug}`, { next: { revalidate: 60 } });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function getRelated(category: string, excludeSlug: string): Promise<Product[]> {
  try {
    const qs = new URLSearchParams({ category, limit: "4" });
    const res = await fetch(`${API_BASE}/api/v1/products?${qs}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const all: Product[] = await res.json();
    return all.filter((p) => p.slug !== excludeSlug).slice(0, 4);
  } catch { return []; }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !product.is_active) notFound();

  const related = await getRelated(product.category, slug);
  const categoryLabel = CATEGORY_LABELS[product.category] ?? product.category;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-ui text-muted mb-6">
        <Link href="/" className="hover:text-forest-mid transition-colors">Home</Link>
        <span>›</span>
        <Link href="/shop" className="hover:text-forest-mid transition-colors">Shop</Link>
        <span>›</span>
        <Link href={`/shop?category=${product.category}`} className="hover:text-forest-mid transition-colors">{categoryLabel}</Link>
        <span>›</span>
        <span className="text-ink truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid sm:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="aspect-square rounded-2xl bg-forest-mist overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-7xl select-none">🛒</span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="inline-block font-ui text-xs font-semibold uppercase tracking-wider bg-forest-mist text-forest-mid px-3 py-1 rounded-full">
              {categoryLabel}
            </span>
            {product.is_mums_pick && (
              <span className="inline-block font-ui text-xs font-semibold uppercase tracking-wider bg-gold text-amber-900 px-3 py-1 rounded-full">
                Mum&apos;s Pick ✨
              </span>
            )}
            {product.origin && (
              <span className="inline-block font-ui text-xs font-medium bg-cream-dark text-muted px-3 py-1 rounded-full">
                From {product.origin}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl font-bold text-forest-deep leading-snug">{product.name}</h1>

          {product.description && (
            <p className="font-body text-base text-muted leading-relaxed">{product.description}</p>
          )}

          <AddToCartSection product={product} />

          <div className="pt-4 border-t border-cream-dark">
            <p className="font-body text-sm italic text-muted">
              Same-day delivery available in Magodo Phase 1, Lagos.{" "}
              <Link href="/delivery" className="text-forest-light hover:underline">Delivery info →</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-xl font-bold text-forest-deep mb-5">More in {categoryLabel}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link key={p.id} href={`/shop/${p.slug}`} className="group bg-white rounded-2xl border border-cream-dark overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] bg-forest-mist overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-ui text-sm font-medium text-ink line-clamp-2">{p.name}</p>
                  <p className="font-ui text-sm font-semibold text-forest-mid mt-1">
                    {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(p.price_ngn)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

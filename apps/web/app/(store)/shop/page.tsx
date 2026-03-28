import { Suspense } from "react";
import type { Product, ProductCategory } from "@/lib/api";
import ProductCard from "../_components/ProductCard";
import ShopFilters from "./_components/ShopFilters";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const CATEGORY_NAMES: Record<string, string> = {
  mums_pick: "Mum's Picks",
  local: "Local Favourites",
  imported: "Imported Goods",
};

async function getProducts(category?: string, search?: string): Promise<Product[]> {
  try {
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (search) qs.set("search", search);
    qs.set("limit", "48");
    const res = await fetch(`${API_BASE}/api/v1/products?${qs}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;
  const products = await getProducts(category, search);

  const heading = search
    ? `Results for "${search}"`
    : category
    ? (CATEGORY_NAMES[category] ?? "Products")
    : "All products";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-forest-deep">{heading}</h1>
        {products.length > 0 && (
          <p className="font-ui text-sm text-muted mt-1">
            {products.length} item{products.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Filters — needs Suspense because useSearchParams() is inside */}
      <Suspense fallback={null}>
        <ShopFilters />
      </Suspense>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-xl text-forest-deep mb-2">Nothing here yet</p>
          <p className="font-body text-sm italic text-muted">
            {search ? "Try a different search term." : "Check back soon — we're stocking up."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { products, type Product } from "@/lib/api";
import { formatNGN } from "@/lib/utils";
import Spinner from "@/components/Spinner";

const CATEGORY_LABELS: Record<string, string> = {
  imported: "Imported", local: "Local", chilled: "Chilled", household: "Household",
};

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["products", category, search],
    queryFn: () => products.list({ category: category || undefined, search: search || undefined, limit: 100 }),
    placeholderData: (prev) => prev,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      products.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-deep">Inventory</h1>
        <Link
          to="/inventory/new"
          className="bg-forest-deep text-cream text-sm font-medium px-4 py-2 rounded-lg hover:bg-forest-mid transition-colors"
        >
          + Add product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light bg-white"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light bg-white"
        >
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium text-right">Price</th>
                  <th className="px-5 py-3 font-medium text-right">Stock</th>
                  <th className="px-5 py-3 font-medium">Active</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((p) => (
                  <tr key={p.id} className={`border-b border-gray-50 ${p.stock_qty <= 3 ? "bg-red-50" : ""}`}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink">{p.name}</div>
                      <div className="text-xs text-muted font-mono">{p.slug}</div>
                      {p.is_mums_pick && (
                        <span className="inline-block text-[10px] bg-gold/20 text-amber-800 px-1.5 py-0.5 rounded mt-0.5">Mum's Pick</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted capitalize">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                    <td className="px-5 py-3 text-right font-semibold text-forest-deep">{formatNGN(p.price_ngn)}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${p.stock_qty <= 3 ? "text-spice" : p.stock_qty <= 10 ? "text-amber-600" : "text-ink"}`}>
                      {p.stock_qty}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleMutation.mutate({ id: p.id, is_active: !p.is_active })}
                        className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${p.is_active ? "bg-forest-light" : "bg-gray-200"}`}
                      >
                        <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${p.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <Link to={`/inventory/${p.id}`} className="text-xs text-forest-light hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

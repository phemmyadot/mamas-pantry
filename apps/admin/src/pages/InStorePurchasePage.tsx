import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { inStoreOrders, products, type Product, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import Spinner from "@/components/Spinner";
import { formatNGN } from "@/lib/utils";

export default function InStorePurchasePage() {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { data: productData, isLoading } = useQuery({
    queryKey: ["in-store-products"],
    queryFn: () => products.list({ limit: 200 }),
  });

  const productsList = productData ?? [];
  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return productsList;
    return productsList.filter((p) =>
      `${p.name} ${p.slug}`.toLowerCase().includes(q),
    );
  }, [productsList, search]);

  const selectedItems = useMemo(() => {
    return productsList
      .filter((p) => (qtyMap[p.id] ?? 0) > 0)
      .map((p) => ({ product: p, qty: qtyMap[p.id] }));
  }, [productsList, qtyMap]);

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, line) => sum + line.product.price_ngn * line.qty, 0),
    [selectedItems],
  );

  function setQty(product: Product, qty: number) {
    const nextQty = Math.max(0, Math.min(qty, product.stock_qty));
    setQtyMap((prev) => ({ ...prev, [product.id]: nextQty }));
  }

  const createMutation = useMutation({
    mutationFn: () =>
      inStoreOrders.create({
        customer_name: "Walk-in Customer",
        customer_phone: null,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        items: selectedItems.map((line) => ({ product_id: line.product.id, qty: line.qty })),
      }),
    onSuccess: (order) => {
      setSuccessMessage(`In-store order #${order.id.slice(0, 8).toUpperCase()} created as paid and delivered.`);
      setError("");
      setNotes("");
      setPaidConfirmed(false);
      setQtyMap({});
    },
    onError: (e: unknown) => {
      setError(e instanceof ApiError ? e.detail : "Failed to create in-store order.");
      setSuccessMessage("");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (selectedItems.length === 0) {
      setError("Select at least one item.");
      return;
    }
    if (!paidConfirmed) {
      setError("Confirm payment before submitting.");
      return;
    }

    createMutation.mutate();
  }

  return (
    <div className="max-w-5xl space-y-4">
      <h1 className="text-xl font-bold text-forest-deep">In-store purchase</h1>
      <p className="text-sm text-muted">Create walk-in orders. Orders are saved as paid and delivered immediately.</p>
      <p className="text-xs text-muted">Attending staff: <span className="font-medium text-ink">{user?.username || user?.email}</span></p>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-forest-deep">Select items</h2>
          <input
            type="text"
            placeholder="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />

          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <div className="max-h-[420px] overflow-auto border border-gray-100 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-muted">
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-right px-3 py-2">Price</th>
                    <th className="text-right px-3 py-2">Stock</th>
                    <th className="text-right px-3 py-2">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-muted">{p.slug}</p>
                      </td>
                      <td className="px-3 py-2 text-right">{formatNGN(p.price_ngn)}</td>
                      <td className="px-3 py-2 text-right">{p.stock_qty}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={p.stock_qty}
                          value={qtyMap[p.id] ?? 0}
                          onChange={(e) => setQty(p, Number(e.target.value || 0))}
                          className="w-20 ml-auto block px-2 py-1 rounded border border-gray-200 text-right"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-forest-deep">Checkout</h2>

          <p className="text-xs text-muted bg-cream px-3 py-2 rounded-lg">
            Walk-in customer details are not required for in-store checkout.
          </p>

          <div className="space-y-1">
            <p className="text-xs text-muted">Payment method</p>
            <div className="flex gap-2">
              {(["cash", "card"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${paymentMethod === method ? "bg-forest-deep text-cream border-forest-deep" : "bg-white text-muted border-gray-200"}`}
                >
                  {method.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm min-h-20"
          />

          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-sm text-muted">Items: <span className="font-medium text-ink">{selectedItems.reduce((n, x) => n + x.qty, 0)}</span></p>
            <p className="text-base font-semibold text-forest-deep">Total: {formatNGN(subtotal)}</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={paidConfirmed}
              onChange={(e) => setPaidConfirmed(e.target.checked)}
              className="accent-forest-deep"
            />
            Payment confirmed ({paymentMethod})
          </label>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full px-4 py-2 rounded-lg bg-forest-deep text-cream text-sm font-medium disabled:opacity-60"
          >
            {createMutation.isPending ? "Saving..." : "Create paid in-store order"}
          </button>

          {error && <p className="text-sm text-spice">{error}</p>}
          {successMessage && <p className="text-sm text-forest-light">{successMessage}</p>}
        </div>
      </form>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inStoreOrders, products, type Product, type Order, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { formatNGN } from "@/lib/utils";

type SelectedLine = {
  product: Product;
  qty: number;
};

type SimpleModalProps = {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
};

function SimpleModal({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
}: SimpleModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <h3 className="text-base font-semibold text-forest-deep">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
        <div className="flex justify-end gap-2">
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-muted"
            >
              {secondaryLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled}
            className="px-4 py-2 rounded-lg bg-forest-deep text-cream text-sm font-medium disabled:opacity-60"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InStorePurchasePage() {
  const DUPLICATE_SCAN_WINDOW_MS = 500;
  const qc = useQueryClient();
  const { user, isAdmin } = useAuth();
  const skuInputRef = useRef<HTMLInputElement | null>(null);
  const lastScanRef = useRef<{ sku: string; ts: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [notes, setNotes] = useState("");
  const [skuInput, setSkuInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedLine[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [paidOrder, setPaidOrder] = useState<Order | null>(null);

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, line) => sum + line.product.price_ngn * line.qty, 0),
    [selectedItems],
  );

  const totalQty = useMemo(
    () => selectedItems.reduce((sum, line) => sum + line.qty, 0),
    [selectedItems],
  );

  const lookupSkuMutation = useMutation({
    mutationFn: async (rawSku: string) => {
      const sku = rawSku.trim().toUpperCase();
      if (!sku) {
        throw new Error("Enter a product SKU.");
      }
      return products.getBySku(sku);
    },
    onSuccess: (product) => {
      if (product.stock_qty <= 0) {
        setError(`${product.name} is out of stock.`);
        focusSkuInput();
        return;
      }

      setSelectedItems((prev) => {
        const idx = prev.findIndex((line) => line.product.id === product.id);
        if (idx === -1) {
          return [...prev, { product, qty: 1 }];
        }

        const current = prev[idx];
        const nextQty = Math.min(current.qty + 1, product.stock_qty);
        if (nextQty === current.qty) {
          setError(`${product.name} has reached available stock (${product.stock_qty}).`);
          return prev;
        }

        const next = [...prev];
        next[idx] = { ...current, qty: nextQty };
        return next;
      });

      setSkuInput("");
      setError("");
      setMessage("");
      focusSkuInput();
    },
    onError: (e: unknown) => {
      if (e instanceof ApiError) {
        setError(e.detail || "SKU not found.");
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Failed to add item by SKU.");
      }
      setMessage("");
      focusSkuInput();
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      inStoreOrders.create({
        customer_name: "Walk-in Customer",
        customer_phone: null,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        items: selectedItems.map((line) => ({ product_id: line.product.id, qty: line.qty })),
      }),
    onSuccess: async (order) => {
      setCreatedOrder(order);
      setError("");
      setMessage("Order created. Confirm payment when cashier receives money.");
      setNotes("");
      setSelectedItems([]);
      setSkuInput("");
      await qc.invalidateQueries({ queryKey: ["orders"] });
      focusSkuInput();
    },
    onError: (e: unknown) => {
      setError(e instanceof ApiError ? e.detail : "Failed to create in-store order.");
      setMessage("");
      focusSkuInput();
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (orderId: string) => inStoreOrders.confirmPayment(orderId),
    onSuccess: async (order) => {
      setCreatedOrder(null);
      setPaidOrder(order);
      setError("");
      setMessage(`Payment confirmed for order #${order.id.slice(0, 8).toUpperCase()}.`);
      await qc.invalidateQueries({ queryKey: ["orders"] });
      await qc.invalidateQueries({ queryKey: ["order", order.id] });
      focusSkuInput();
    },
    onError: (e: unknown) => {
      setError(e instanceof ApiError ? e.detail : "Failed to confirm payment.");
      focusSkuInput();
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: () => inStoreOrders.cleanupPending(),
    onSuccess: (data) => {
      setError("");
      setMessage(`Cleanup complete. Cancelled ${data.cancelled_count} pending in-store order(s).`);
      focusSkuInput();
    },
    onError: (e: unknown) => {
      setError(e instanceof ApiError ? e.detail : "Failed to clean pending orders.");
      focusSkuInput();
    },
  });

  useEffect(() => {
    skuInputRef.current?.focus();
  }, []);

  function focusSkuInput() {
    setTimeout(() => {
      skuInputRef.current?.focus();
    }, 0);
  }

  function handleAddBySku() {
    setError("");
    const normalized = skuInput.trim().toUpperCase();
    if (!normalized) {
      setError("Enter a product SKU.");
      focusSkuInput();
      return;
    }

    const now = Date.now();
    if (
      lastScanRef.current &&
      lastScanRef.current.sku === normalized &&
      now - lastScanRef.current.ts <= DUPLICATE_SCAN_WINDOW_MS
    ) {
      focusSkuInput();
      return;
    }

    lastScanRef.current = { sku: normalized, ts: now };
    lookupSkuMutation.mutate(normalized);
  }

  function setQty(productId: string, qty: number) {
    setSelectedItems((prev) =>
      prev
        .map((line) => {
          if (line.product.id !== productId) return line;
          return { ...line, qty: Math.max(0, Math.min(qty, line.product.stock_qty)) };
        })
        .filter((line) => line.qty > 0),
    );
  }

  function removeItem(productId: string) {
    setSelectedItems((prev) => prev.filter((line) => line.product.id !== productId));
  }

  function handleCreateOrder() {
    setError("");
    setMessage("");

    if (selectedItems.length === 0) {
      setError("Add at least one item by SKU.");
      return;
    }

    createMutation.mutate();
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-forest-deep">In-store purchase</h1>
          <p className="text-sm text-muted">Scan or type product SKU and press Enter to add items.</p>
          <p className="text-xs text-muted">Attending staff: <span className="font-medium text-ink">{user?.username || user?.email}</span></p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-muted hover:bg-gray-50 disabled:opacity-60"
          >
            {cleanupMutation.isPending ? "Cleaning pending..." : "EOD cleanup pending"}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-forest-deep">Add items by SKU</h2>

          <div className="flex gap-2">
            <input
              ref={skuInputRef}
              type="text"
              placeholder="Enter or scan SKU"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddBySku();
                }
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono uppercase"
            />
            <button
              type="button"
              onClick={handleAddBySku}
              disabled={lookupSkuMutation.isPending}
              className="px-4 py-2 rounded-lg bg-forest-deep text-cream text-sm font-medium disabled:opacity-60"
            >
              {lookupSkuMutation.isPending ? "Adding..." : "Add"}
            </button>
          </div>

          <div className="max-h-[420px] overflow-auto border border-gray-100 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-muted">
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="text-left px-3 py-2">SKU</th>
                  <th className="text-right px-3 py-2">Price</th>
                  <th className="text-right px-3 py-2">Qty</th>
                  <th className="text-right px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted">No items added yet.</td>
                  </tr>
                ) : (
                  selectedItems.map((line) => (
                    <tr key={line.product.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <p className="font-medium text-ink">{line.product.name}</p>
                        <p className="text-xs text-muted">Stock: {line.product.stock_qty}</p>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted">{line.product.sku}</td>
                      <td className="px-3 py-2 text-right">{formatNGN(line.product.price_ngn)}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={line.product.stock_qty}
                          value={line.qty}
                          onChange={(e) => setQty(line.product.id, Number(e.target.value || 0))}
                          className="w-20 ml-auto block px-2 py-1 rounded border border-gray-200 text-right"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(line.product.id)}
                          className="text-xs text-spice hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-forest-deep">Checkout</h2>

          <p className="text-xs text-muted bg-cream px-3 py-2 rounded-lg">
            Create order first, then confirm payment only when customer payment succeeds.
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
            <p className="text-sm text-muted">Items: <span className="font-medium text-ink">{totalQty}</span></p>
            <p className="text-base font-semibold text-forest-deep">Total: {formatNGN(subtotal)}</p>
          </div>

          <button
            type="button"
            onClick={handleCreateOrder}
            disabled={createMutation.isPending}
            className="w-full px-4 py-2 rounded-lg bg-forest-deep text-cream text-sm font-medium disabled:opacity-60"
          >
            {createMutation.isPending ? "Creating..." : "Create order"}
          </button>

          {error && <p className="text-sm text-spice">{error}</p>}
          {message && <p className="text-sm text-forest-light">{message}</p>}
        </div>
      </div>

      {createdOrder && (
        <SimpleModal
          title="Order Created"
          description={`Order #${createdOrder.id.slice(0, 8).toUpperCase()} is saved as unpaid. Confirm payment once customer payment succeeds.`}
          primaryLabel={confirmPaymentMutation.isPending ? "Confirming..." : "Confirm payment"}
          secondaryLabel="Close"
          onPrimary={() => confirmPaymentMutation.mutate(createdOrder.id)}
          onSecondary={() => setCreatedOrder(null)}
          primaryDisabled={confirmPaymentMutation.isPending}
        />
      )}

      {paidOrder && (
        <SimpleModal
          title="Payment Confirmed"
          description={`Order #${paidOrder.id.slice(0, 8).toUpperCase()} is now marked paid and delivered.`}
          primaryLabel="Done"
          onPrimary={() => setPaidOrder(null)}
        />
      )}
    </div>
  );
}

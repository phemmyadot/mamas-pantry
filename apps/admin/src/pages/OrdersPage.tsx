import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { orders, type OrderStatus } from "@/lib/api";
import { formatNGN, formatDateTime } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import Spinner from "@/components/Spinner";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "packed", label: "Packed" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 25;

export default function OrdersPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", status, page],
    queryFn: () => orders.list({
      status: status || undefined,
      offset: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-deep">Orders</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatus(opt.value); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border
              ${status === opt.value
                ? "bg-forest-deep text-cream border-forest-deep"
                : "bg-white text-muted border-gray-200 hover:border-forest-light"
              }`}
          >
            {opt.label}
          </button>
        ))}
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
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link
                        to={`/orders/${o.id}`}
                        className="font-mono text-xs text-forest-light hover:underline"
                      >
                        #{o.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted whitespace-nowrap">
                      {formatDateTime(o.created_at)}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                      {o.items[0] && ` · ${o.items[0].product_name}${o.items.length > 1 ? ` +${o.items.length - 1}` : ""}`}
                    </td>
                    <td className="px-5 py-3 font-semibold text-forest-deep whitespace-nowrap">
                      {formatNGN(o.total_ngn)}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3"><StatusBadge status={o.payment_status} /></td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted">
                      No orders{status ? ` with status "${status}"` : ""}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(data?.length === PAGE_SIZE || page > 0) && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs font-medium text-muted hover:text-forest-deep disabled:opacity-40"
            >
              ← Previous
            </button>
            <span className="text-xs text-muted">Page {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(data?.length ?? 0) < PAGE_SIZE}
              className="text-xs font-medium text-muted hover:text-forest-deep disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

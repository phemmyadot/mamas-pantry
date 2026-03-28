import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customers } from "@/lib/api";
import { formatNGN, formatDate } from "@/lib/utils";
import Spinner from "@/components/Spinner";

const PAGE_SIZE = 25;

export default function CustomersPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", page],
    queryFn: () => customers.list({ offset: page * PAGE_SIZE, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="max-w-5xl space-y-4">
      <h1 className="text-xl font-bold text-forest-deep">Customers</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium text-right">Orders</th>
                  <th className="px-5 py-3 font-medium text-right">Total spent</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{c.full_name ?? "—"}</p>
                      <p className="text-xs text-muted">{c.email}</p>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">{c.order_count}</td>
                    <td className="px-5 py-3 text-right font-semibold text-forest-deep">{formatNGN(c.total_spend_ngn)}</td>
                    <td className="px-5 py-3 text-xs text-muted">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted">No customers yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

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

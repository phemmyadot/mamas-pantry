import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { adminUsers } from "@/lib/api";
import { formatDateTime, formatNGN } from "@/lib/utils";
import Spinner from "@/components/Spinner";
import StatusBadge from "@/components/StatusBadge";

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-forest-deep">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["staff-performance", id],
    queryFn: () => adminUsers.getStaffPerformance(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;
  if (isError || !data) return <p className="text-sm text-spice py-10">Failed to load staff performance.</p>;

  const m = data.metrics;

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/staff-access" className="text-sm text-muted hover:text-forest-deep">Back to staff access</Link>
          <h1 className="text-xl font-bold text-forest-deep mt-1">Staff Detail</h1>
          <p className="text-sm text-muted">{data.user.username ?? data.user.email}</p>
          <p className="text-xs text-muted mt-1">
            Order period:{" "}
            <span className="font-medium text-ink">
              {m.first_order_at
                ? `${formatDateTime(m.first_order_at)} - ${formatDateTime(m.last_order_at ?? m.first_order_at)}`
                : "No orders"}
            </span>
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard label="Total orders" value={String(m.total_orders)} />
        <MetricCard label="Total items" value={String(m.total_items)} sub="Used to derive speed per item" />
        <MetricCard label="Avg daily orders" value={m.avg_daily_orders.toFixed(2)} />
        <MetricCard label="Avg daily revenue" value={formatNGN(m.avg_daily_revenue_ngn)} />
        <MetricCard label="Paid orders" value={String(m.paid_orders)} />
        <MetricCard label="Pending orders" value={String(m.pending_orders)} />
        <MetricCard label="Total revenue" value={formatNGN(m.total_revenue_ngn)} />
        <MetricCard
          label="Avg order processing time"
          value={`${m.avg_order_processing_minutes.toFixed(1)} min`}
          sub="From order creation to latest update"
        />
        <MetricCard
          label="Avg time per item"
          value={`${m.avg_time_per_item_minutes.toFixed(1)} min`}
          sub="Derived from processing time / item count"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-forest-deep">Recent in-store orders</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Processing</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.recent_orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50">
                <td className="px-5 py-3">
                  <Link to={`/orders/${o.id}`} className="font-mono text-xs text-forest-deep hover:underline">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted">{formatDateTime(o.created_at)}</td>
                <td className="px-5 py-3 text-muted">{o.item_count}</td>
                <td className="px-5 py-3 text-muted">{o.processing_minutes.toFixed(1)} min</td>
                <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-3"><StatusBadge status={o.payment_status} /></td>
                <td className="px-5 py-3 text-right font-semibold text-forest-deep">{formatNGN(o.total_ngn)}</td>
              </tr>
            ))}
            {data.recent_orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted">No in-store orders yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

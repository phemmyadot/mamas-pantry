import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { dashboard } from "@/lib/api";
import { formatNGN, formatDateTime } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/contexts/auth-context";

function KpiCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "bg-forest-deep text-cream border-forest-deep" : "bg-white border-gray-200"}`}>
      <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${accent ? "text-forest-pale opacity-70" : "text-muted"}`}>{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-cream" : "text-forest-deep"}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-forest-pale opacity-60" : "text-muted"}`}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { isAdmin, isStaff } = useAuth();

  if (isStaff && !isAdmin) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-xl font-bold text-forest-deep">Dashboard</h1>
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-muted">Staff dashboard coming soon</p>
        </div>
      </div>
    );
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboard.get,
    refetchInterval: 120_000,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;
  if (error || !data) return <p className="text-sm text-spice py-10">Failed to load dashboard.</p>;

  const chartData = data.weekly_revenue.map((d) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString("en-NG", { weekday: "short" }),
    isSat: new Date(d.date).getDay() === 6,
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-xl font-bold text-forest-deep">Dashboard</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Today's revenue"
          value={formatNGN(data.today_revenue_ngn)}
          accent
        />
        <KpiCard
          label="Active orders"
          value={String(data.active_orders_count)}
          sub="pending + confirmed"
        />
        <KpiCard
          label="Low stock alerts"
          value={String(data.low_stock_count)}
          sub="below threshold"
        />
        <KpiCard
          label="New customers"
          value={String(data.new_customers_today)}
          sub="today"
        />
      </div>

      {/* Weekly revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-forest-deep mb-4">Weekly revenue</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5C5C5C" }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              tick={{ fontSize: 11, fill: "#5C5C5C" }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              formatter={(v: number) => [formatNGN(v), "Revenue"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="revenue_ngn" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.isSat ? "#D4A017" : "#2D6A4F"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-forest-deep">Recent orders</h2>
          <Link to="/orders" className="text-xs text-forest-light hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-muted">
                <th className="px-5 py-2 font-medium">Order</th>
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="px-5 py-2 font-medium">Total</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  onClick={() => window.location.href = `/orders/${o.id}`}
                >
                  <td className="px-5 py-3 font-mono text-xs text-forest-deep">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3 text-muted text-xs whitespace-nowrap">
                    {formatDateTime(o.created_at)}
                  </td>
                  <td className="px-5 py-3 font-semibold text-forest-deep whitespace-nowrap">
                    {formatNGN(o.total_ngn)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.payment_status} />
                  </td>
                </tr>
              ))}
              {data.recent_orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted text-sm">No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

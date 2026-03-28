import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { analytics } from "@/lib/api";
import { formatNGN, formatDate } from "@/lib/utils";
import Spinner from "@/components/Spinner";

const CATEGORY_COLORS: Record<string, string> = {
  imported: "#1B4332",
  local: "#40916C",
  chilled: "#2D6A4F",
  household: "#D4A017",
};

function dateRange(days: number) {
  const to = new Date();
  const from = new Date(Date.now() - days * 86400_000);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

const RANGES = [
  { label: "7 days",  days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { from, to } = dateRange(days);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", days],
    queryFn: () => analytics.get(from, to),
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;
  if (!data) return <p className="text-sm text-spice py-10">Failed to load analytics.</p>;

  const chartData = data.revenue_by_date.map((d) => ({
    ...d,
    label: formatDate(d.date).slice(0, 6),
  }));

  const pieData = data.category_breakdown.map((d) => ({
    name: d.category,
    value: d.revenue_ngn,
  }));

  const totalRevenue = data.revenue_by_date.reduce((s, d) => s + d.revenue_ngn, 0);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-deep">Analytics</h1>
        <div className="flex gap-1">
          {RANGES.map(({ label, days: d }) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                ${days === d ? "bg-forest-deep text-cream border-forest-deep" : "bg-white text-muted border-gray-200 hover:border-forest-light"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-forest-deep rounded-xl p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-forest-pale opacity-70 uppercase tracking-wide mb-1">Total revenue</p>
          <p className="text-2xl font-bold text-cream">{formatNGN(totalRevenue)}</p>
          <p className="text-xs text-forest-pale opacity-60 mt-0.5">Last {days} days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Avg / day</p>
          <p className="text-xl font-bold text-forest-deep">{formatNGN(totalRevenue / days)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Top product</p>
          <p className="text-sm font-bold text-forest-deep truncate">
            {data.top_products[0]?.product_name ?? "—"}
          </p>
          {data.top_products[0] && (
            <p className="text-xs text-muted">{formatNGN(data.top_products[0].total_revenue_ngn)}</p>
          )}
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-forest-deep mb-4">Revenue over time</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={days <= 7 ? 32 : days <= 30 ? 14 : 6}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#5C5C5C" }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => `₦${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              tick={{ fontSize: 10, fill: "#5C5C5C" }}
              axisLine={false} tickLine={false} width={48}
            />
            <Tooltip formatter={(v: number) => [formatNGN(v), "Revenue"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="revenue_ngn" fill="#2D6A4F" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-forest-deep">Top products</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 text-xs text-muted">
                <th className="px-5 py-2 font-medium text-left">Product</th>
                <th className="px-5 py-2 font-medium text-right">Qty</th>
                <th className="px-5 py-2 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.top_products.slice(0, 10).map((p) => (
                <tr key={p.product_id} className="border-b border-gray-50">
                  <td className="px-5 py-2.5 text-ink truncate max-w-[140px]">{p.product_name}</td>
                  <td className="px-5 py-2.5 text-right text-muted">{p.total_qty}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-forest-deep">{formatNGN(p.total_revenue_ngn)}</td>
                </tr>
              ))}
              {data.top_products.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-6 text-center text-muted">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-forest-deep mb-4">Category breakdown</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[entry.name] ?? "#2D6A4F"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatNGN(v)} />
                <Legend formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)} iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted text-center py-10">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}

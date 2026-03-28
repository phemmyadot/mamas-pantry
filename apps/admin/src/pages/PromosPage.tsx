import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { promoCodes, type PromoCodeCreate } from "@/lib/api";
import { formatDate, formatNGN } from "@/lib/utils";
import Spinner from "@/components/Spinner";

const EMPTY: PromoCodeCreate = {
  code: "", discount_type: "PERCENTAGE",
  discount_value: 0, min_order_ngn: null,
  max_uses: null, expires_at: null,
};

export default function PromosPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PromoCodeCreate>(EMPTY);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: promoCodes.list,
  });

  const createMutation = useMutation({
    mutationFn: () => promoCodes.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promo-codes"] });
      setShowForm(false);
      setForm(EMPTY);
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const now = new Date();
  const active = (data ?? []).filter((p) => !p.expires_at || new Date(p.expires_at) > now);
  const expired = (data ?? []).filter((p) => p.expires_at && new Date(p.expires_at) <= now);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-deep">Promo codes</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-forest-deep text-cream text-sm font-medium px-4 py-2 rounded-lg hover:bg-forest-mid transition-colors"
        >
          + New code
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
          className="bg-white rounded-xl border border-gray-200 p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-forest-deep">New promo code</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Code *</label>
              <input
                required type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. WELCOME20"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-forest-light"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Type *</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as "PERCENTAGE" | "FIXED" }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed (₦)</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Value * {form.discount_type === "PERCENTAGE" ? "(%)" : "(₦)"}
              </label>
              <input
                required type="number" min={0}
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Min order (₦)</label>
              <input
                type="number" min={0}
                value={form.min_order_ngn ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, min_order_ngn: e.target.value ? Number(e.target.value) : null }))}
                placeholder="No minimum"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Max uses</label>
              <input
                type="number" min={1}
                value={form.max_uses ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))}
                placeholder="Unlimited"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-xs font-medium text-muted mb-1">Expires</label>
            <input
              type="date"
              value={form.expires_at?.slice(0, 10) ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value ? `${e.target.value}T23:59:59Z` : null }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
          </div>

          {error && <p className="text-xs text-spice">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-forest-deep text-cream text-sm font-medium px-5 py-2 rounded-lg hover:bg-forest-mid disabled:opacity-60 transition-colors"
            >
              {createMutation.isPending ? "Creating…" : "Create code"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-muted hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Active</h2>
              <PromoList items={active} />
            </section>
          )}
          {expired.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 mt-4">Expired</h2>
              <PromoList items={expired} dim />
            </section>
          )}
          {data?.length === 0 && (
            <p className="text-sm text-muted text-center py-10">No promo codes yet.</p>
          )}
        </>
      )}
    </div>
  );
}

function PromoList({ items, dim = false }: { items: ReturnType<typeof promoCodes.list> extends Promise<infer T> ? T : never; dim?: boolean }) {
  return (
    <div className="space-y-2">
      {items.map((p) => (
        <div key={p.id} className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4 ${dim ? "opacity-50" : ""}`}>
          <div>
            <p className="font-mono font-semibold text-sm text-ink">{p.code}</p>
            <p className="text-xs text-muted mt-0.5">
              {p.discount_type === "percentage"
                ? `${p.discount_value}% off`
                : `₦${p.discount_value.toLocaleString()} off`}
              {p.min_order_ngn ? ` · min order ${formatNGN(p.min_order_ngn)}` : ""}
              {p.max_uses ? ` · ${p.max_uses} uses max` : " · unlimited"}
              {p.expires_at ? ` · expires ${formatDate(p.expires_at)}` : ""}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold text-forest-deep">{p.used_count}</p>
            <p className="text-xs text-muted">used</p>
          </div>
        </div>
      ))}
    </div>
  );
}

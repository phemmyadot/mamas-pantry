import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shipments, type Shipment, type ShipmentCreate, type ShipmentStatus } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import Spinner from "@/components/Spinner";

const STATUS_OPTIONS: ShipmentStatus[] = ["upcoming", "in_transit", "arrived", "cancelled"];

const EMPTY: ShipmentCreate = {
  name: "", origin_country: "",
  departure_date: "", arrival_date: "",
  status: "upcoming", notes: null,
};

export default function ShipmentsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ShipmentCreate>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["shipments"],
    queryFn: shipments.list,
  });

  const createMutation = useMutation({
    mutationFn: () => shipments.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shipments"] }); resetForm(); },
    onError: (e: Error) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => shipments.update(editId!, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shipments"] }); resetForm(); },
    onError: (e: Error) => setError(e.message),
  });

  function resetForm() {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY);
    setError("");
  }

  function startEdit(s: Shipment) {
    if (!s) return;
    setEditId(s.id);
    setForm({
      name: s.name, origin_country: s.origin_country,
      departure_date: s.departure_date.slice(0, 10),
      arrival_date: s.arrival_date.slice(0, 10),
      status: s.status, notes: s.notes,
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (editId) updateMutation.mutate();
    else createMutation.mutate();
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-deep">Shipments</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-forest-deep text-cream text-sm font-medium px-4 py-2 rounded-lg hover:bg-forest-mid transition-colors"
        >
          + New shipment
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-forest-deep">{editId ? "Edit shipment" : "New shipment"}</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Shipment name", placeholder: "e.g. March 2026 US Run" },
              { key: "origin_country", label: "Origin country", placeholder: "e.g. USA" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-muted mb-1">{label} *</label>
                <input
                  required
                  type="text"
                  value={(form as unknown as Record<string, string>)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
                />
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Departure date *</label>
              <input
                required type="date"
                value={form.departure_date}
                onChange={(e) => setForm((f) => ({ ...f, departure_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Arrival date *</label>
              <input
                required type="date"
                value={form.arrival_date}
                onChange={(e) => setForm((f) => ({ ...f, arrival_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ShipmentStatus }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1">Notes</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light resize-none"
            />
          </div>

          {error && <p className="text-xs text-spice">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-forest-deep text-cream text-sm font-medium px-5 py-2 rounded-lg hover:bg-forest-mid disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : editId ? "Save changes" : "Create shipment"}
            </button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-muted hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-ink">{s.name}</p>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-xs text-muted">
                  {s.origin_country} · Departs {formatDate(s.departure_date)} · Arrives {formatDate(s.arrival_date)}
                </p>
                {s.notes && <p className="text-xs italic text-muted mt-0.5">{s.notes}</p>}
              </div>
              <button
                onClick={() => startEdit(s)}
                className="text-xs text-forest-light hover:underline flex-shrink-0"
              >
                Edit
              </button>
            </div>
          ))}
          {data?.length === 0 && (
            <p className="text-sm text-muted text-center py-10">No shipments yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

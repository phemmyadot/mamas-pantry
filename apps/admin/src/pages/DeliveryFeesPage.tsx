import { useEffect, useState } from "react";
import { deliveryFees, ApiError, type DeliveryFee } from "@/lib/api";

export default function DeliveryFeesPage() {
  const [rows, setRows] = useState<DeliveryFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    deliveryFees
      .list()
      .then(setRows)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.detail : "Failed to load delivery fees."))
      .finally(() => setLoading(false));
  }, []);

  function updateFee(id: string, value: string) {
    const fee = Number(value);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, fee_ngn: Number.isFinite(fee) ? fee : 0 } : r)));
  }

  function updateArea(id: string, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, area: value } : r)));
  }

  function addLocation() {
    setRows((prev) => [...prev, { id: `new-${Date.now()}-${prev.length}`, area: "", fee_ngn: 500 }]);
  }

  function removeLocation(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    const cleaned = rows.map((r) => ({ area: r.area.trim(), fee_ngn: Number(r.fee_ngn) }));
    if (cleaned.some((r) => !r.area)) {
      setSaving(false);
      setError("Area name is required for every row.");
      return;
    }
    const normalized = cleaned.map((r) => r.area.toLowerCase());
    if (new Set(normalized).size !== normalized.length) {
      setSaving(false);
      setError("Area names must be unique.");
      return;
    }
    try {
      const saved = await deliveryFees.save(cleaned);
      setRows(saved);
      setMessage("Delivery fees updated.");
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "Failed to save delivery fees.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-deep">Delivery fees</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addLocation}
            disabled={saving || loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-60"
          >
            Add location
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 rounded-lg bg-forest-deep text-cream text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <p className="text-sm text-muted">Add/remove service areas and set delivery fee (NGN) for each one.</p>

      {loading ? (
        <p className="text-sm text-muted">Loading fees...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">Area</th>
                <th className="px-5 py-3 font-medium text-right">Delivery fee (NGN)</th>
                <th className="px-5 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                return (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={row.area}
                        onChange={(e) => updateArea(row.id, e.target.value)}
                        placeholder="e.g. Ikeja GRA"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200"
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={row.fee_ngn}
                        onChange={(e) => updateFee(row.id, e.target.value)}
                        className="w-32 ml-auto px-3 py-1.5 rounded-lg border border-gray-200 text-right"
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeLocation(row.id)}
                        className="text-xs text-spice"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-spice">{error}</p>}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { addresses, type Address, type AddressCreate, ApiError } from "@/lib/api";

const AREA_OPTIONS = ["Magodo Phase 1", "Magodo Phase 2", "Alapere", "Ketu", "Ojota", "Other"];

export default function AddressesPage() {
  const [list, setList] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<AddressCreate>({ label: "Home", street: "", area: "Magodo Phase 1", city: "Lagos", is_default: false });

  useEffect(() => {
    addresses.list().then(setList).finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await addresses.create(form);
      setList((prev) => [...prev, created]);
      setShowForm(false);
      setForm({ label: "Home", street: "", area: "Magodo Phase 1", city: "Lagos", is_default: false });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save address.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await addresses.delete(id).catch(() => {});
    setList((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/account" className="font-ui text-sm text-forest-light hover:underline">← Account</Link>
        <span className="text-muted">/</span>
        <h1 className="font-display text-2xl font-bold text-forest-deep">Saved addresses</h1>
      </div>

      {loading ? (
        <div className="text-center py-10 font-ui text-sm text-muted animate-pulse">Loading…</div>
      ) : (
        <div className="space-y-3 mb-6">
          {list.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-cream-dark p-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-ui text-sm font-semibold text-ink">{a.label}</p>
                  {a.is_default && <span className="font-ui text-xs bg-forest-mist text-forest-deep px-2 py-0.5 rounded-full">Default</span>}
                </div>
                <p className="font-ui text-sm text-muted">{a.street}</p>
                <p className="font-ui text-sm text-muted">{a.area}, {a.city}</p>
              </div>
              <button onClick={() => handleDelete(a.id)} className="text-muted hover:text-spice transition-colors text-xs font-ui flex-shrink-0">
                Remove
              </button>
            </div>
          ))}
          {list.length === 0 && !showForm && (
            <p className="font-body text-sm italic text-muted text-center py-6">No saved addresses yet.</p>
          )}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-cream-dark text-muted font-ui text-sm py-3 rounded-2xl hover:border-forest-light hover:text-forest-light transition-colors"
        >
          + Add new address
        </button>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-cream-dark p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-forest-deep">New address</h2>
          {[
            { name: "label", label: "Label", placeholder: "e.g. Home, Office" },
            { name: "street", label: "Street address", placeholder: "e.g. 12B Ogunyemi Street" },
            { name: "city", label: "City", placeholder: "Lagos" },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block font-ui text-xs font-medium text-muted mb-1">{label}</label>
              <input
                type="text"
                required
                value={(form as unknown as Record<string, string>)[name]}
                onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
              />
            </div>
          ))}
          <div>
            <label className="block font-ui text-xs font-medium text-muted mb-1">Area</label>
            <select value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light">
              {AREA_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} className="accent-forest-deep" />
            <span className="font-ui text-sm text-ink">Set as default delivery address</span>
          </label>
          {error && <p className="font-ui text-sm text-spice">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 bg-forest-deep text-cream font-ui text-sm font-medium py-2.5 rounded-lg hover:bg-forest-mid disabled:opacity-60 transition-colors">
              {saving ? "Saving…" : "Save address"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-cream-dark rounded-lg font-ui text-sm text-muted hover:bg-cream transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

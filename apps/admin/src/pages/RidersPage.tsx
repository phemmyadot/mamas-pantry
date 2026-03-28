import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { riders } from "@/lib/api";
import Spinner from "@/components/Spinner";

export default function RidersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["riders"],
    queryFn: riders.list,
  });

  const createMutation = useMutation({
    mutationFn: () => riders.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riders"] });
      setShowForm(false);
      setForm({ name: "", phone: "" });
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      riders.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["riders"] }),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-deep">Riders</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-forest-deep text-cream text-sm font-medium px-4 py-2 rounded-lg hover:bg-forest-mid transition-colors"
        >
          + Add rider
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
          className="bg-white rounded-xl border border-gray-200 p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-forest-deep">New rider</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Full name", placeholder: "e.g. Emeka Obi" },
              { key: "phone", label: "Phone number", placeholder: "e.g. 0812 345 6789" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-muted mb-1">{label} *</label>
                <input
                  required
                  type="text"
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
                />
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-spice">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-forest-deep text-cream text-sm font-medium px-5 py-2 rounded-lg hover:bg-forest-mid disabled:opacity-60 transition-colors"
            >
              {createMutation.isPending ? "Adding…" : "Add rider"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-muted hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold ${r.is_active ? "bg-forest-mist text-forest-deep" : "bg-gray-100 text-muted"}`}>
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm text-ink">{r.name}</p>
                  <p className="text-xs text-muted">{r.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${r.is_active ? "text-forest-light" : "text-muted"}`}>
                  {r.is_active ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => toggleMutation.mutate({ id: r.id, is_active: !r.is_active })}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${r.is_active ? "bg-forest-light" : "bg-gray-200"}`}
                >
                  <span className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${r.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          ))}
          {data?.length === 0 && (
            <p className="text-sm text-muted text-center py-10">No riders yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUsers, ApiError, type AdminUser } from "@/lib/api";
import Spinner from "@/components/Spinner";

function hasRole(user: AdminUser, role: "staff" | "rider") {
  return (user.roles ?? []).some((r) => r.name === role);
}

export default function StaffManagementPage() {
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState<{ email: string; role: "staff" | "rider" } | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    username: "",
    role: "staff" as "staff" | "rider",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["staff-users"],
    queryFn: () => adminUsers.listStaffUsers(),
  });

  const managedUsers = data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      adminUsers.createStaffUser({
        email: form.email.trim(),
        password: form.password,
        username: form.username.trim() || null,
        role: form.role,
      }),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ["staff-users"] });
      setCreatedUser({ email: user.email, role: form.role });
      setForm({ email: "", password: "", username: "", role: "staff" });
      setError("");
    },
    onError: (e: unknown) => setError(e instanceof ApiError ? e.detail : "Failed to create account."),
  });

  const roleMutation = useMutation({
    mutationFn: async (vars: { userId: string; role: "staff" | "rider"; enabled: boolean }) => {
      if (vars.enabled) {
        await adminUsers.assignAccessRole(vars.userId, vars.role);
      } else {
        await adminUsers.removeAccessRole(vars.userId, vars.role);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-users"] });
      setError("");
    },
    onError: (e: unknown) => setError(e instanceof ApiError ? e.detail : "Failed to update role."),
  });

  return (
    <div className="max-w-5xl space-y-5">
      <h1 className="text-xl font-bold text-forest-deep">Staff & rider access</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate();
        }}
        className="bg-white rounded-xl border border-gray-200 p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-forest-deep">Create staff/rider account</h2>
        <div className="grid md:grid-cols-4 gap-3">
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
          <input
            type="text"
            placeholder="Username (optional)"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "staff" | "rider" }))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
          >
            <option value="staff">Staff</option>
            <option value="rider">Rider</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-4 py-2 rounded-lg bg-forest-deep text-cream text-sm font-medium disabled:opacity-60"
        >
          {createMutation.isPending ? "Creating..." : "Create account"}
        </button>
      </form>

      {error && <p className="text-sm text-spice">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Staff</th>
                <th className="px-5 py-3 font-medium">Rider</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {managedUsers.map((u) => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{u.email}</p>
                    <p className="text-xs text-muted">{u.username ?? "-"}</p>
                  </td>
                  {(["staff", "rider"] as const).map((role) => {
                    const enabled = hasRole(u, role);
                    return (
                      <td key={role} className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) =>
                            roleMutation.mutate({ userId: u.id, role, enabled: e.target.checked })
                          }
                          disabled={roleMutation.isPending}
                          className="accent-forest-deep"
                        />
                      </td>
                    );
                  })}
                  <td className="px-5 py-3">
                    <span className={u.is_active ? "text-forest-light" : "text-spice"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {hasRole(u, "staff") ? (
                      <Link to={`/staff-access/${u.id}`} className="text-xs text-forest-light hover:underline">
                        View performance
                      </Link>
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {managedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">No eligible users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {createdUser && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-lg p-5 space-y-4">
            <h2 className="text-base font-semibold text-forest-deep">Account created</h2>
            <p className="text-sm text-muted">
              <span className="font-medium text-ink">{createdUser.email}</span> was created as{" "}
              <span className="font-medium text-ink">{createdUser.role}</span>.
            </p>
            <p className="text-xs text-muted">
              Share the temporary password securely and ask the user to change it on first login.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCreatedUser(null)}
                className="px-4 py-2 rounded-lg bg-forest-deep text-cream text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

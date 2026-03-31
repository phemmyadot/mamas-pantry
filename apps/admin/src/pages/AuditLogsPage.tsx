import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditLogs, type AuditLog } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import Spinner from "@/components/Spinner";

const PAGE_SIZE = 50;

const EVENT_TYPES = [
  "register", "login_success", "login_failed", "logout", "logout_all",
  "password_reset_request", "password_reset_confirm",
  "email_verification_sent", "email_verified",
  "phone_otp_sent", "phone_verified",
  "totp_enabled", "totp_disabled", "totp_failed",
  "api_key_created", "api_key_revoked",
  "oauth_login", "role_assigned", "role_removed",
  "user_banned", "token_refreshed",
];

function eventBadgeColor(type: string): string {
  if (type.includes("failed") || type.includes("banned")) return "bg-red-50 text-red-700";
  if (type.includes("login_success") || type.includes("verified") || type.includes("enabled")) return "bg-green-50 text-green-700";
  if (type.includes("logout") || type.includes("reset") || type.includes("revoked") || type.includes("disabled")) return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [eventType, setEventType] = useState("");
  const [userId, setUserId] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, eventType, userId, startDate, endDate],
    queryFn: () =>
      auditLogs.list({
        event_type: eventType || undefined,
        user_id: userId || undefined,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate + "T23:59:59").toISOString() : undefined,
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  function applyUserId() {
    setUserId(userIdInput.trim());
    setPage(0);
  }

  function clearFilters() {
    setEventType("");
    setUserId("");
    setUserIdInput("");
    setStartDate("");
    setEndDate("");
    setPage(0);
  }

  const hasFilters = !!(eventType || userId || startDate || endDate);

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-forest-deep">Audit logs</h1>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-spice hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">Event type</label>
          <select
            value={eventType}
            onChange={(e) => { setEventType(e.target.value); setPage(0); }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
          >
            <option value="">All events</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">User ID</label>
          <div className="flex gap-1">
            <input
              type="text"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyUserId()}
              placeholder="UUID"
              className="w-64 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-light"
            />
            <button
              onClick={applyUserId}
              className="px-3 py-1.5 rounded-lg bg-forest-deep text-cream text-xs font-medium hover:bg-forest-mid"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-muted">
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">User ID</th>
                  <th className="px-4 py-3 font-medium">IP address</th>
                  <th className="px-4 py-3 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((log: AuditLog) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 align-top">
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${eventBadgeColor(log.event_type)}`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {log.user_id ? (
                        <button
                          className="hover:text-forest-deep hover:underline"
                          onClick={() => { setUserIdInput(log.user_id!); setUserId(log.user_id!); setPage(0); }}
                          title="Filter by this user"
                        >
                          {log.user_id.slice(0, 8)}…
                        </button>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{log.ip_address || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted max-w-xs">
                      {Object.keys(log.metadata_).length > 0 ? (
                        <pre className="whitespace-pre-wrap break-all font-mono text-[10px]">
                          {JSON.stringify(log.metadata_, null, 2)}
                        </pre>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
                {data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {((data?.length ?? 0) === PAGE_SIZE || page > 0) && (
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

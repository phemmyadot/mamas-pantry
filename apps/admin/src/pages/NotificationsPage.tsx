import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface BroadcastResponse { sent_to: number; }

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<BroadcastResponse>("/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({ title, body }),
      }),
    onSuccess: (data) => {
      setSent(data.sent_to);
      setTitle("");
      setBody("");
    },
  });

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-xl font-bold text-forest-deep">Push Notifications</h1>
      <p className="text-sm text-muted">
        Send a push notification to all subscribed customers. Customers must have enabled
        notifications in their account settings.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); setSent(null); mutation.mutate(); }}
        className="bg-white rounded-xl border border-gray-200 p-5 space-y-4"
      >
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Title *</label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New stock arrived!"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Message *</label>
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="e.g. Fresh imported goods are now in stock. Shop before they sell out!"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light resize-none"
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-spice">Failed to send notification.</p>
        )}
        {sent !== null && (
          <p className="text-sm text-forest-light font-medium">
            ✓ Sent to {sent} subscriber{sent !== 1 ? "s" : ""}.
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-forest-deep text-cream font-medium text-sm py-2.5 rounded-lg hover:bg-forest-mid disabled:opacity-60 transition-colors"
        >
          {mutation.isPending ? "Sending…" : "Send to all subscribers"}
        </button>
      </form>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-1">Setup required</p>
        <p className="text-xs text-amber-700">
          Push notifications require a Firebase project. Set{" "}
          <code className="bg-amber-100 px-1 rounded">FCM_SERVER_KEY</code> in backend{" "}
          <code className="bg-amber-100 px-1 rounded">.env</code> and the{" "}
          <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_FIREBASE_*</code>{" "}
          vars in the storefront <code className="bg-amber-100 px-1 rounded">.env.local</code>.
        </p>
      </div>
    </div>
  );
}

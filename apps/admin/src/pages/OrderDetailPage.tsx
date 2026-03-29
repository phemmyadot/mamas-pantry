import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orders, riders, type OrderStatus } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { formatNGN, formatDateTime } from "@/lib/utils";
import StatusBadge from "@/components/StatusBadge";
import Spinner from "@/components/Spinner";

const DELIVERY_STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "packed", "out_for_delivery", "delivered"];
const PICKUP_STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "packed", "ready_for_pickup", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", packed: "Packed",
  ready_for_pickup: "Ready for pickup", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => orders.get(id!),
  });

  const { data: riderList } = useQuery({
    queryKey: ["riders"],
    queryFn: riders.list,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => orders.updateStatus(id!, status),
    onMutate: (status: string) => {
      setPendingStatus(status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onSettled: () => {
      setPendingStatus(null);
    },
  });

  const riderMutation = useMutation({
    mutationFn: (riderId: string) => orders.assignRider(id!, riderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;
  if (!order) return <p className="text-sm text-spice py-10">Order not found.</p>;

  const isPickup = order.delivery_address?.fulfillment_type === "pickup";
  const statusFlow = isPickup ? PICKUP_STATUS_FLOW : DELIVERY_STATUS_FLOW;
  const currentIdx = statusFlow.indexOf(order.status as OrderStatus);
  const canAssignRider = !isPickup && order.status === "out_for_delivery";
  const canMarkDelivered = isPickup ? order.status === "ready_for_pickup" : Boolean(order.rider_id);

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-sm text-muted hover:text-forest-deep">← Back</button>
        <h1 className="text-xl font-bold text-forest-deep">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isPickup ? "bg-cyan-100 text-cyan-800" : "bg-slate-100 text-slate-700"}`}>
          {isPickup ? "Pickup" : "Delivery"}
        </span>
        <StatusBadge status={order.status} />
        <StatusBadge status={order.payment_status} />
      </div>

      {/* Status timeline */}
      {order.status !== "cancelled" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-forest-deep mb-4">Status timeline</h2>
          <div className="flex gap-0">
            {statusFlow.map((s, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={s} className="flex-1 flex flex-col items-center gap-1 relative">
                  {i > 0 && (
                    <div className={`absolute top-3.5 right-1/2 w-full h-0.5 -translate-y-1/2 ${i <= currentIdx ? "bg-forest-deep" : "bg-gray-200"}`} />
                  )}
                  <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2
                    ${done ? "bg-forest-deep border-forest-deep text-cream" : "bg-white border-gray-200 text-muted"}
                    ${active ? "ring-2 ring-forest-light ring-offset-1" : ""}`}>
                    {done && !active ? "✓" : i + 1}
                  </div>
                  <span className={`text-[9px] text-center leading-tight ${active ? "font-semibold text-forest-deep" : "text-muted"}`}>
                    {STATUS_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && (
      <div className={`grid gap-4 ${isPickup ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
        {/* Status update */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-forest-deep">Update status</h2>
          <select
            value={pendingStatus ?? order.status}
            onChange={(e) => {
              const nextStatus = e.target.value;
              if (nextStatus !== order.status) {
                statusMutation.mutate(nextStatus);
              }
            }}
            disabled={statusMutation.isPending}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
          >
            {[...statusFlow, "cancelled"].map((s) => (
              <option key={s} value={s} disabled={s === "delivered" && !canMarkDelivered}>
                {STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
          {statusMutation.isPending && (
            <p className="text-xs text-muted inline-flex items-center gap-2">
              <Spinner className="w-3.5 h-3.5" />
              Updating status...
            </p>
          )}
          {statusMutation.isError && <p className="text-xs text-spice">Failed to update status.</p>}
        </div>

        {/* Rider assign */}
        {!isPickup && <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-forest-deep">Assign rider</h2>
          <select
            value={order.rider_id ?? ""}
            onChange={(e) => e.target.value && riderMutation.mutate(e.target.value)}
            disabled={riderMutation.isPending || !canAssignRider}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
          >
            <option value="">— Select rider —</option>
            {(riderList ?? []).filter((r) => r.is_active).map((r) => (
              <option key={r.id} value={r.id}>{r.name} · {r.phone}</option>
            ))}
          </select>
          {riderMutation.isError && <p className="text-xs text-spice">Failed to assign rider.</p>}
        </div>}
      </div>
      )}

      {/* Delivery address */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <h2 className="text-sm font-semibold text-forest-deep mb-3">Delivery details</h2>
        {[
          ["Name", order.delivery_address.name],
          ["Phone", order.delivery_address.phone],
          ["Address", order.delivery_address.address],
          ["City", order.delivery_address.city],
          ["Placed", formatDateTime(order.created_at)],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted">{label}</span>
            <span className="text-ink font-medium text-right max-w-[60%]">{val}</span>
          </div>
        ))}
        {order.notes && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Notes</span>
            <span className="text-ink text-right max-w-[60%] italic">{order.notes}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-forest-deep">Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 text-left text-xs text-muted">
              <th className="px-5 py-2 font-medium">Product</th>
              <th className="px-5 py-2 font-medium text-right">Qty</th>
              <th className="px-5 py-2 font-medium text-right">Unit price</th>
              <th className="px-5 py-2 font-medium text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-50">
                <td className="px-5 py-3 font-medium text-ink">{item.product_name}</td>
                <td className="px-5 py-3 text-center text-muted">{item.qty}</td>
                <td className="px-5 py-3 text-right text-muted">{formatNGN(item.unit_price_ngn)}</td>
                <td className="px-5 py-3 text-right font-semibold text-forest-deep">
                  {formatNGN(item.unit_price_ngn * item.qty)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-200 text-sm">
            <tr>
              <td colSpan={3} className="px-5 py-2 text-right text-muted">Subtotal</td>
              <td className="px-5 py-2 text-right">{formatNGN(order.subtotal_ngn)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-5 py-2 text-right text-muted">Delivery fee</td>
              <td className="px-5 py-2 text-right">{formatNGN(order.delivery_fee_ngn)}</td>
            </tr>
            <tr className="font-bold">
              <td colSpan={3} className="px-5 py-3 text-right text-forest-deep">Total</td>
              <td className="px-5 py-3 text-right text-forest-deep">{formatNGN(order.total_ngn)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

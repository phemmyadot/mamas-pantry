const ORDER_COLORS: Record<string, string> = {
  pending:          "bg-amber-100 text-amber-800",
  confirmed:        "bg-blue-100 text-blue-800",
  packed:           "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered:        "bg-green-100 text-green-800",
  cancelled:        "bg-red-100 text-red-700",
  unpaid:           "bg-amber-100 text-amber-800",
  paid:             "bg-green-100 text-green-800",
  failed:           "bg-red-100 text-red-700",
  upcoming:         "bg-blue-100 text-blue-800",
  in_transit:       "bg-purple-100 text-purple-800",
  arrived:          "bg-green-100 text-green-800",
};

const LABELS: Record<string, string> = {
  out_for_delivery: "Out for delivery",
  in_transit: "In transit",
};

export default function StatusBadge({ status }: { status: string }) {
  const color = ORDER_COLORS[status] ?? "bg-gray-100 text-gray-700";
  const label = LABELS[status] ?? status.replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${color}`}>
      {label}
    </span>
  );
}

import Link from "next/link";

const ZONES = [
  { name: "Magodo Phase 1", sameDay: true, cutoff: "2:00 pm" },
  { name: "Magodo Phase 2", sameDay: true, cutoff: "2:00 pm" },
  { name: "Alapere", sameDay: true, cutoff: "1:00 pm" },
  { name: "Ketu", sameDay: true, cutoff: "1:00 pm" },
  { name: "Ojota", sameDay: false, cutoff: "—" },
];

const TIME_SLOTS = [
  { label: "Today 2 – 6 pm", note: "Order before 2 pm" },
  { label: "Today 6 – 9 pm", note: "Order before 6 pm" },
  { label: "Tomorrow AM (9 am – 1 pm)", note: "Order by midnight" },
  { label: "Tomorrow PM (2 – 6 pm)", note: "Order by midnight" },
];

export default function DeliveryPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-4xl font-bold text-forest-deep mb-2">Delivery info</h1>
      <p className="font-body text-base italic text-muted mb-10">
        Everything you need to know about how and when we deliver.
      </p>

      {/* Fee */}
      <section className="bg-cream rounded-2xl border border-cream-dark p-6 mb-8">
        <h2 className="font-display text-xl font-bold text-forest-deep mb-3">Delivery fee</h2>
        <p className="font-ui text-2xl font-bold text-forest-mid mb-1">₦500</p>
        <p className="font-body text-sm italic text-muted">Flat fee on every order, regardless of size.</p>
      </section>

      {/* Delivery zones */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-bold text-forest-deep mb-4">Delivery zones</h2>
        <div className="overflow-x-auto rounded-2xl border border-cream-dark">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-cream">
                <th className="font-ui text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3">Area</th>
                <th className="font-ui text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3">Same-day</th>
                <th className="font-ui text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3">Order cut-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {ZONES.map((z) => (
                <tr key={z.name} className="bg-white">
                  <td className="font-ui text-sm font-medium text-ink px-4 py-3">{z.name}</td>
                  <td className="px-4 py-3">
                    {z.sameDay
                      ? <span className="font-ui text-xs font-semibold bg-forest-mist text-forest-mid px-2 py-0.5 rounded-full">Yes</span>
                      : <span className="font-ui text-xs text-muted">Next-day only</span>}
                  </td>
                  <td className="font-ui text-sm text-muted px-4 py-3">{z.cutoff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Time slots */}
      <section className="mb-8">
        <h2 className="font-display text-xl font-bold text-forest-deep mb-4">Delivery time slots</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {TIME_SLOTS.map(({ label, note }) => (
            <div key={label} className="bg-white rounded-2xl border border-cream-dark p-4">
              <p className="font-ui text-sm font-semibold text-ink">{label}</p>
              <p className="font-body text-xs italic text-muted mt-0.5">{note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="bg-forest-deep rounded-2xl p-6 text-forest-pale space-y-3">
        <h2 className="font-display text-lg font-bold text-cream">Good to know</h2>
        {[
          "Orders placed after the cut-off time are automatically scheduled for the next available slot.",
          "Someone should be available at the delivery address to receive the order.",
          "If you have questions about your delivery, message us on WhatsApp.",
        ].map((note) => (
          <p key={note} className="font-body text-sm italic opacity-80">• {note}</p>
        ))}
      </section>

      <div className="mt-8 text-center">
        <Link href="/shop" className="bg-forest-deep text-cream font-ui text-sm font-medium px-6 py-3 rounded-lg hover:bg-forest-mid transition-colors inline-block">
          Start shopping →
        </Link>
      </div>
    </div>
  );
}

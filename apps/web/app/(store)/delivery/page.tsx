"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { deliveryZones, type DeliveryZone } from "@/lib/api";

const DEFAULT_ZONES: Pick<DeliveryZone, "area" | "fee_ngn">[] = [
  { area: "Magodo Phase 1", fee_ngn: 500 },
  { area: "Magodo Phase 2", fee_ngn: 500 },
  { area: "Alapere", fee_ngn: 500 },
  { area: "Ketu", fee_ngn: 500 },
  { area: "Ojota", fee_ngn: 500 },
];

const TIME_SLOTS = [
  { label: "Today 2 - 6 pm", note: "Order before 2 pm" },
  { label: "Today 6 - 9 pm", note: "Order before 6 pm" },
  { label: "Tomorrow AM (9 am - 1 pm)", note: "Order by midnight" },
  { label: "Tomorrow PM (2 - 6 pm)", note: "Order by midnight" },
];

export default function DeliveryPage() {
  const [zones, setZones] = useState<Pick<DeliveryZone, "area" | "fee_ngn">[]>([]);

  useEffect(() => {
    deliveryZones
      .list()
      .then((items) => setZones(items.map((z) => ({ area: z.area, fee_ngn: z.fee_ngn }))))
      .catch(() => {});
  }, []);

  const tableZones = zones.length > 0 ? zones : DEFAULT_ZONES;

  const fromFee = useMemo(() => {
    if (tableZones.length === 0) return null;
    return Math.min(...tableZones.map((z) => Number(z.fee_ngn)));
  }, [tableZones]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-4xl font-bold text-forest-deep mb-2">Delivery info</h1>
      <p className="font-body text-base italic text-muted mb-10">
        Everything you need to know about how and when we deliver.
      </p>

      <section className="bg-cream rounded-2xl border border-cream-dark p-6 mb-8">
        <h2 className="font-display text-xl font-bold text-forest-deep mb-3">Delivery fee</h2>
        <p className="font-ui text-2xl font-bold text-forest-mid mb-1">
          {fromFee == null ? "Loading..." : `From NGN ${fromFee.toLocaleString("en-NG")}`}
        </p>
        <p className="font-body text-sm italic text-muted">Fees depend on your selected area at checkout.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl font-bold text-forest-deep mb-4">Delivery zones</h2>
        <div className="overflow-x-auto rounded-2xl border border-cream-dark">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-cream">
                <th className="font-ui text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3">Area</th>
                <th className="font-ui text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3 text-right">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {tableZones.map((z) => (
                <tr key={z.area} className="bg-white">
                  <td className="font-ui text-sm font-medium text-ink px-4 py-3">{z.area}</td>
                  <td className="font-ui text-sm text-muted px-4 py-3 text-right">
                    NGN {Number(z.fee_ngn).toLocaleString("en-NG")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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

      <section className="bg-forest-deep rounded-2xl p-6 text-forest-pale space-y-3">
        <h2 className="font-display text-lg font-bold text-cream">Good to know</h2>
        {[
          "Orders placed after the cut-off time are automatically scheduled for the next available slot.",
          "Someone should be available at the delivery address to receive the order.",
          "If you have questions about your delivery, message us on WhatsApp.",
        ].map((note) => (
          <p key={note} className="font-body text-sm italic opacity-80">- {note}</p>
        ))}
      </section>

      <div className="mt-8 text-center">
        <Link href="/shop" className="bg-forest-deep text-cream font-ui text-sm font-medium px-6 py-3 rounded-lg hover:bg-forest-mid transition-colors inline-block">
          Start shopping
        </Link>
      </div>
    </div>
  );
}

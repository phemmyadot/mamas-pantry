import Link from "next/link";

interface Props {
  name: string;
  originCountry: string;
  arrivalDate: string;
  status: string;
  /** Show a "Pre-order →" button (default true) */
  showCta?: boolean;
}

function daysUntil(dateStr: string) {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000));
}

export default function ShipmentCountdown({
  name, originCountry, arrivalDate, status, showCta = true,
}: Props) {
  const days = daysUntil(arrivalDate);
  const arrivalLabel = new Date(arrivalDate).toLocaleDateString("en-NG", {
    day: "numeric", month: "long",
  });

  return (
    <div className="bg-forest-deep rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <div>
        <p className="font-ui text-xs uppercase tracking-widest text-forest-pale opacity-70 mb-1">
          {status === "in_transit" ? "In transit" : "Next shipment"}
        </p>
        <p className="font-display text-xl font-bold text-cream">{name}</p>
        <p className="font-body text-sm italic text-forest-pale opacity-80 mt-0.5">
          From {originCountry} · arriving {arrivalLabel}
        </p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-center">
          <p className="font-display text-4xl font-bold text-gold">{days}</p>
          <p className="font-ui text-xs text-forest-pale opacity-70">
            {days === 1 ? "day" : "days"} away
          </p>
        </div>
        {showCta && (
          <Link
            href="/pre-order"
            className="bg-gold text-forest-deep font-ui text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gold-light transition-colors"
          >
            Pre-order →
          </Link>
        )}
      </div>
    </div>
  );
}

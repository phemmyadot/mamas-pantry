"use client";

import { useEffect, useState } from "react";
import { loyalty, type LoyaltyBalance } from "@/lib/api";

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", minimumFractionDigits: 0,
  }).format(n);
}

export default function LoyaltyPointsDisplay() {
  const [data, setData] = useState<LoyaltyBalance | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loyalty.me().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="bg-gradient-to-r from-forest-deep to-forest-mid rounded-2xl p-4 text-cream">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-ui text-xs uppercase tracking-widest text-forest-pale opacity-70 mb-0.5">
            Loyalty points
          </p>
          <div className="flex items-baseline gap-2">
            <p className="font-display text-3xl font-bold">{data.points.toLocaleString()}</p>
            <p className="font-ui text-sm text-forest-pale opacity-80">pts</p>
          </div>
          <p className="font-body text-xs italic text-forest-pale opacity-70 mt-0.5">
            Worth {formatNGN(data.ngn_value)} · earn 1 pt per ₦100 spent
          </p>
        </div>
        <div className="text-3xl opacity-60 select-none">⭐</div>
      </div>

      {data.transactions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-forest-mid/50">
          <button
            onClick={() => setOpen((v) => !v)}
            className="font-ui text-xs text-forest-pale opacity-70 hover:opacity-100 transition-opacity"
          >
            {open ? "Hide history ↑" : `View history (${data.transactions.length}) ↓`}
          </button>

          {open && (
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
              {data.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs">
                  <span className="text-forest-pale opacity-80 truncate mr-2">{tx.description}</span>
                  <span className={`font-semibold flex-shrink-0 ${tx.points > 0 ? "text-gold-light" : "text-red-300"}`}>
                    {tx.points > 0 ? "+" : ""}{tx.points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";

export default function InStorePurchasePage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("In-store purchase captured (basic mode). Backend posting can be wired next.");
    setCustomerName("");
    setPhone("");
    setAmount("");
    setNotes("");
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-forest-deep">In-store purchase</h1>
      <p className="text-sm text-muted">Basic capture form for walk-in orders.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            required
            type="text"
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
          <input
            type="text"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
        </div>
        <input
          required
          min={0}
          step="0.01"
          type="number"
          placeholder="Amount (NGN)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm min-h-24"
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-forest-deep text-cream text-sm font-medium">
          Save in-store purchase
        </button>
        {message && <p className="text-sm text-forest-light">{message}</p>}
      </form>
    </div>
  );
}

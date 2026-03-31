"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { orders, addresses, deliveryZones, type Address, type DeliveryAddress, type DeliveryZone, type FulfillmentType, ApiError } from "@/lib/api";
import { track, Events } from "@/lib/analytics";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PaystackPop: any;
  }
}

const DEFAULT_AREA_OPTIONS = ["Magodo Phase 1", "Magodo Phase 2", "Alapere", "Ketu", "Ojota"];

/** Returns Lagos current hour (UTC+1) */
function lagosHour() {
  return new Date(Date.now() + 60 * 60 * 1000).getUTCHours();
}

interface Slot {
  id: string;
  label: string;
  sub: string;
  cutoff: number; // Lagos hour — disable "today" slots at or after this
  isToday: boolean;
}

const SLOTS: Slot[] = [
  { id: "today_afternoon", label: "Today, 2 – 6 pm", sub: "Order by 1:30 pm", cutoff: 13, isToday: true },
  { id: "today_evening", label: "Today, 6 – 9 pm", sub: "Order by 5:30 pm", cutoff: 17, isToday: true },
  { id: "tmrw_morning", label: "Tomorrow, 9 am – 1 pm", sub: "Order anytime today", cutoff: 99, isToday: false },
  { id: "tmrw_afternoon", label: "Tomorrow, 2 – 6 pm", sub: "Order anytime today", cutoff: 99, isToday: false },
];

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
}

function normalizeNigerianPhone(value: string): string | null {
  let compact = value.trim().replace(/\s+/g, "").replace(/-/g, "").replace(/[()]/g, "");
  if (compact.startsWith("+234")) {
    compact = `0${compact.slice(4)}`;
  } else if (compact.startsWith("234")) {
    compact = `0${compact.slice(3)}`;
  }
  if (!/^0[789]\d{9}$/.test(compact)) return null;
  return compact;
}

type Step = 1 | 2 | 3;

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string }>;
}) {
  const { promo: initialPromo = "" } = use(searchParams);
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<DeliveryAddress & { area: string }>({
    name: "",
    phone: "",
    address: "",
    area: "Magodo Phase 1",
    city: "Lagos",
  });

  const [slot, setSlot] = useState<string>("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("delivery");
  const [areaOptions, setAreaOptions] = useState<string[]>(DEFAULT_AREA_OPTIONS);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [promoCode, setPromoCode] = useState(initialPromo);
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const hour = lagosHour();

  // Load saved addresses for logged-in users
  useEffect(() => {
    if (!isAuthenticated) return;
    addresses.list().then((list) => {
      setSavedAddresses(list);
      const def = list.find((a) => a.is_default) ?? list[0];
      if (def) setSelectedAddressId(def.id);
    }).catch(() => { });
  }, [isAuthenticated]);

  useEffect(() => {
    deliveryZones
      .list()
      .then((list) => {
        setZones(list);
        const options = list.map((z) => z.area);
        if (options.length > 0) {
          setAreaOptions(options);
          setAddressForm((f) => ({ ...f, area: options.includes(f.area) ? f.area : options[0] }));
        }
      })
      .catch(() => {});
  }, []);

  // Inject Paystack script
  useEffect(() => {
    if (document.getElementById("paystack-js")) return;
    const script = document.createElement("script");
    script.id = "paystack-js";
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="font-display text-xl text-forest-deep mb-2">Your cart is empty</p>
        <p className="font-body text-sm italic text-muted mb-6">Add some items before checking out.</p>
        <Link href="/shop" className="bg-forest-deep text-cream font-ui text-sm font-medium px-6 py-3 rounded-lg hover:bg-forest-mid transition-colors inline-block">
          Browse products
        </Link>
      </div>
    );
  }

  // ─── Derived address for the order ──────────────────────────────────────────
function buildDeliveryAddress(): DeliveryAddress {
    if (fulfillmentType === "pickup") {
      return {
        name: (user?.email?.split("@")[0] ?? addressForm.name) || "Pickup Customer",
        phone: addressForm.phone,
        address: "Mama's Pantry, Magodo Phase 1",
        area: "Magodo Phase 1",
        city: "Lagos",
        fulfillment_type: "pickup",
      };
    }

    if (isAuthenticated && !useNewAddress && selectedAddressId) {
      const a = savedAddresses.find((x) => x.id === selectedAddressId)!;
      return {
        name: user?.email?.split("@")[0] ?? "",
        phone: addressForm.phone, // still need phone
        address: `${a.street}, ${a.area}`,
        area: a.area,
        city: a.city,
        fulfillment_type: fulfillmentType,
      };
    }
    return {
      name: addressForm.name,
      phone: addressForm.phone,
      address: `${addressForm.address}, ${addressForm.area}`,
      area: addressForm.area,
      city: addressForm.city,
      fulfillment_type: fulfillmentType,
    };
  }

  // ─── Step 1: validate address ────────────────────────────────────────────────
function handleStep1Next() {
    const normalizedPhone = normalizeNigerianPhone(addressForm.phone);
    if (!normalizedPhone) {
      setError("Please enter a valid Nigerian phone number (e.g. 08012345678).");
      return;
    }

    if (fulfillmentType === "pickup") {
      setAddressForm((f) => ({ ...f, phone: normalizedPhone }));
      setError("");
      setStep(3);
      track(Events.CHECKOUT_START, { item_count: items.length, subtotal: totalPrice });
      return;
    }

    if (isAuthenticated && !useNewAddress && savedAddresses.length > 0) {
      if (!selectedAddressId) { setError("Please select a delivery address."); return; }
    } else {
      if (!addressForm.name || !addressForm.address) {
        setError("Please fill in all required fields.");
        return;
      }
    }
    setAddressForm((f) => ({ ...f, phone: normalizedPhone }));
    setError("");
    setStep(2);
  }

  // ─── Step 2: validate slot ───────────────────────────────────────────────────
  function handleStep2Next() {
    if (!slot) { setError("Please choose a delivery time."); return; }
    setError("");
    setStep(3);
    track(Events.CHECKOUT_START, { item_count: items.length, subtotal: totalPrice });
  }

  // ─── Step 3: promo preview (optimistic, real validation on create) ────────────
  function handlePromoChange(code: string) {
    setPromoCode(code);
    setPromoError("");
    setDiscount(0); // reset; actual validation is server-side
  }

  // ─── Place order + Paystack ───────────────────────────────────────────────────
  async function handlePay() {
    setError("");
    setPlacing(true);

    let orderId: string;
    let totalNgn: number;

    try {
      const order = await orders.create(
        items.map((i) => ({ product_id: i.product.id, qty: i.qty })),
        buildDeliveryAddress(),
        promoCode || undefined,
        fulfillmentType,
      );
      orderId = order.id;
      totalNgn = Number(order.total_ngn);
      setDiscount(Number(order.subtotal_ngn) + Number(order.delivery_fee_ngn) - Number(order.total_ngn));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to place order. Please try again.");
      if (err instanceof ApiError && err.detail.toLowerCase().includes("promo")) {
        setPromoError(err.detail);
      }
      setPlacing(false);
      return;
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY;

    // If no Paystack key configured, skip payment and go straight to confirmation
    if (!paystackKey || !window.PaystackPop) {
      clearCart();
      window.location.href = `/checkout/confirmation?order=${orderId}`;
      return;
    }

    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: paystackKey,
      email: user?.email ?? "guest@mamaspantry.ng",
      amount: totalNgn * 100, // Paystack uses kobo
      currency: "NGN",
      ref: orderId,
      metadata: { order_id: orderId, slot },
      onSuccess: () => {
        track(Events.ORDER_PLACED, { order_id: orderId, total_ngn: totalNgn });
        clearCart();
        window.location.href = `/checkout/confirmation?order=${orderId}&paid=1`;
      },
      onCancel: () => {
        setPlacing(false);
        setError("Payment was cancelled. Your order has been saved — you can retry payment from your order history.");
      },
    });
    setPlacing(false);
  }

  const subtotal = totalPrice;
  const selectedArea = isAuthenticated && !useNewAddress && selectedAddressId
    ? (savedAddresses.find((x) => x.id === selectedAddressId)?.area ?? addressForm.area)
    : addressForm.area;
  const effectiveDeliveryFee = fulfillmentType === "pickup"
    ? 0
    : (zones.find((z) => z.area === selectedArea)?.fee_ngn ?? 0);
  const estimatedTotal = subtotal + effectiveDeliveryFee - discount;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {([1, 2, 3] as Step[]).map((s, i) => {
          const labels = ["Fulfillment", "Delivery", "Payment"];
          const done = step > s;
          const active = step === s;
          return (
            <div key={s} className="flex items-center flex-1">
              <button
                disabled={s > step}
                onClick={() => s < step && setStep(s)}
                className="flex items-center gap-2 group disabled:cursor-default"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                  ${done ? "bg-forest-deep border-forest-deep text-cream" : active ? "bg-white border-forest-deep text-forest-deep" : "bg-white border-cream-dark text-muted"}`}>
                  {done ? "✓" : s}
                </div>
                <span className={`font-ui text-sm hidden sm:block ${active ? "font-semibold text-forest-deep" : done ? "text-forest-light group-hover:underline" : "text-muted"}`}>
                  {labels[i]}
                </span>
              </button>
              {i < 2 && <div className={`flex-1 h-px mx-3 ${done ? "bg-forest-deep" : "bg-cream-dark"}`} />}
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-[1fr_340px] gap-8 items-start">
        {/* Main panel */}
        <div>
          {/* ── STEP 1: Address ── */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-forest-deep">Fulfillment & details</h2>

              <div>
                <label className="block font-ui text-xs font-medium text-muted mb-2">How do you want to receive this order?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("delivery")}
                    className={`px-3 py-2 rounded-lg border text-sm font-ui ${fulfillmentType === "delivery" ? "border-forest-deep bg-forest-mist text-forest-deep" : "border-cream-dark bg-white text-muted"}`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("pickup")}
                    className={`px-3 py-2 rounded-lg border text-sm font-ui ${fulfillmentType === "pickup" ? "border-forest-deep bg-forest-mist text-forest-deep" : "border-cream-dark bg-white text-muted"}`}
                  >
                    Pickup
                  </button>
                </div>
              </div>

              {fulfillmentType === "pickup" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block font-ui text-xs font-medium text-muted mb-1">Phone number <span className="text-spice">*</span></label>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      autoComplete="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="e.g. 0812 345 6789"
                      className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
                    />
                  </div>
                  <p className="font-ui text-xs text-muted">Pickup location: Mama&apos;s Pantry, Magodo Phase 1, Lagos.</p>
                </div>
              ) : (isAuthenticated && savedAddresses.length > 0 && !useNewAddress ? (
                <>
                  <div className="space-y-2">
                    {savedAddresses.map((a) => (
                      <label key={a.id} className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-colors ${selectedAddressId === a.id ? "border-forest-deep bg-forest-mist" : "border-cream-dark bg-white hover:border-forest-light"}`}>
                        <input
                          type="radio"
                          name="address"
                          value={a.id}
                          checked={selectedAddressId === a.id}
                          onChange={() => setSelectedAddressId(a.id)}
                          className="mt-0.5 accent-forest-deep"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-ui text-sm font-semibold text-ink">{a.label}</p>
                            {a.is_default && <span className="font-ui text-xs bg-forest-mist text-forest-deep px-1.5 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="font-ui text-sm text-muted">{a.street}, {a.area}</p>
                          <p className="font-ui text-sm text-muted">{a.city}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="block font-ui text-xs font-medium text-muted mb-1">Phone number <span className="text-spice">*</span></label>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      autoComplete="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="e.g. 0812 345 6789"
                      className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setUseNewAddress(true)}
                    className="font-ui text-sm text-forest-light hover:underline"
                  >
                    + Use a different address
                  </button>
                </>
              ) : (
                <>
                  {isAuthenticated && savedAddresses.length > 0 && (
                    <button type="button" onClick={() => setUseNewAddress(false)} className="font-ui text-sm text-forest-light hover:underline mb-1 block">
                      ← Back to saved addresses
                    </button>
                  )}
                  <div className="space-y-4">
                    {[
                      { name: "name" as const, label: "Full name", placeholder: "e.g. Adaeze Okafor", type: "text" },
                      { name: "phone" as const, label: "Phone number", placeholder: "e.g. 0812 345 6789", type: "tel" },
                      { name: "address" as const, label: "Street address", placeholder: "e.g. 12B Ogunyemi Street", type: "text" },
                    ].map(({ name, label, placeholder, type }) => (
                      <div key={name}>
                        <label className="block font-ui text-xs font-medium text-muted mb-1">{label} <span className="text-spice">*</span></label>
                        <input
                          type={type}
                          required
                          inputMode={name === "phone" ? "numeric" : undefined}
                          autoComplete={name === "phone" ? "tel" : undefined}
                          value={addressForm[name]}
                          onChange={(e) => setAddressForm((f) => ({ ...f, [name]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block font-ui text-xs font-medium text-muted mb-1">Area <span className="text-spice">*</span></label>
                      <select
                        value={addressForm.area}
                        onChange={(e) => setAddressForm((f) => ({ ...f, area: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
                      >
                        {areaOptions.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-ui text-xs font-medium text-muted mb-1">City</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-cream-dark bg-cream font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light"
                      />
                    </div>
                  </div>
                </>
              ))}

              {error && <p className="font-ui text-sm text-spice">{error}</p>}

              <button
                onClick={handleStep1Next}
                className="w-full bg-forest-deep text-cream font-ui font-medium text-sm py-3 rounded-lg hover:bg-forest-mid transition-colors"
              >
                {fulfillmentType === "pickup" ? "Continue to review ->" : "Continue to delivery ->"}
              </button>
            </div>
          )}

          {/* ── STEP 2: Delivery slot ── */}
          {step === 2 && fulfillmentType === "delivery" && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-forest-deep">Choose delivery time</h2>
              <p className="font-body text-sm italic text-muted -mt-2">Lagos time (WAT)</p>

              <div className="space-y-2">
                {SLOTS.map((s) => {
                  const disabled = s.isToday && hour >= s.cutoff;
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors
                        ${disabled ? "opacity-40 cursor-not-allowed bg-cream border-cream-dark" :
                          slot === s.id ? "border-forest-deep bg-forest-mist cursor-pointer" :
                            "border-cream-dark bg-white hover:border-forest-light cursor-pointer"}`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={s.id}
                        checked={slot === s.id}
                        disabled={disabled}
                        onChange={() => setSlot(s.id)}
                        className="accent-forest-deep"
                      />
                      <div>
                        <p className={`font-ui text-sm font-semibold ${slot === s.id ? "text-forest-deep" : "text-ink"}`}>{s.label}</p>
                        <p className="font-ui text-xs text-muted">{disabled ? "Cut-off passed" : s.sub}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {error && <p className="font-ui text-sm text-spice">{error}</p>}

              <div className="flex gap-2">
                <button onClick={() => { setError(""); setStep(1); }} className="px-5 py-3 border border-cream-dark rounded-lg font-ui text-sm text-muted hover:bg-cream transition-colors">
                  ← Back
                </button>
                <button
                  onClick={handleStep2Next}
                  className="flex-1 bg-forest-deep text-cream font-ui font-medium text-sm py-3 rounded-lg hover:bg-forest-mid transition-colors"
                >
                  Review order →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review & Pay ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-bold text-forest-deep">Review & pay</h2>

              {/* Promo code */}
              <div>
                <label className="block font-ui text-xs font-medium text-muted mb-1">Promo code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => handlePromoChange(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-3 py-2.5 rounded-lg border border-cream-dark bg-cream font-ui text-sm focus:outline-none focus:ring-2 focus:ring-forest-light uppercase placeholder:normal-case"
                  />
                </div>
                {promoError && <p className="font-ui text-xs text-spice mt-1">{promoError}</p>}
                <p className="font-ui text-xs text-muted mt-1">Applied at checkout — discount shown after placing order.</p>
              </div>

              {/* Delivery summary */}
              <div className="bg-cream rounded-2xl border border-cream-dark p-4 space-y-1 text-sm font-ui">
                <div className="flex justify-between">
                  <span className="text-muted">{fulfillmentType === "pickup" ? "Pickup location" : "Delivering to"}</span>
                  <span className="text-ink font-medium text-right max-w-[55%]">
                    {fulfillmentType === "pickup"
                      ? "Mama's Pantry, Magodo Phase 1, Lagos"
                      : isAuthenticated && !useNewAddress && selectedAddressId
                      ? (() => { const a = savedAddresses.find((x) => x.id === selectedAddressId); return a ? `${a.street}, ${a.area}` : ""; })()
                      : `${addressForm.address}, ${addressForm.area}`}
                  </span>
                </div>
                {fulfillmentType === "delivery" ? (
                  <div className="flex justify-between">
                    <span className="text-muted">Delivery slot</span>
                    <span className="text-ink font-medium">{SLOTS.find((s) => s.id === slot)?.label}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted">Pickup</span>
                    <span className="text-ink font-medium">You will be notified when ready</span>
                  </div>
                )}
              </div>

              {error && <p className="font-ui text-sm text-spice">{error}</p>}

              <div className="flex gap-2">
                <button onClick={() => { setError(""); setStep(fulfillmentType === "pickup" ? 1 : 2); }} className="px-5 py-3 border border-cream-dark rounded-lg font-ui text-sm text-muted hover:bg-cream transition-colors">
                  ← Back
                </button>
                <button
                  onClick={handlePay}
                  disabled={placing}
                  className="flex-1 bg-forest-deep text-cream font-ui font-medium text-sm py-3 rounded-lg hover:bg-forest-mid disabled:opacity-60 transition-colors"
                >
                  {placing ? "Processing…" : `Pay ${formatNGN(estimatedTotal)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="bg-white rounded-2xl border border-cream-dark p-5 h-fit">
          <h2 className="font-display text-base font-bold text-forest-deep mb-4">Order summary</h2>
          <div className="space-y-3 mb-4">
            {items.map(({ product, qty }) => (
              <div key={product.id} className="flex gap-3 items-start">
                <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-forest-mist flex items-center justify-center overflow-hidden">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base">🛒</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-ui text-sm font-medium text-ink line-clamp-1">{product.name}</p>
                  <p className="font-ui text-xs text-muted">× {qty}</p>
                </div>
                <p className="font-ui text-sm font-semibold text-forest-mid flex-shrink-0">
                  {formatNGN(product.price_ngn * qty)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-cream-dark pt-3 space-y-1.5 text-sm font-ui">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="text-ink">{formatNGN(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{fulfillmentType === "pickup" ? "Pickup" : "Delivery"}</span>
              <span className="text-ink">{formatNGN(effectiveDeliveryFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-forest-light">
                <span>Promo discount</span>
                <span>− {formatNGN(discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1.5 border-t border-cream-dark font-bold">
              <span className="text-forest-deep">Total</span>
              <span className="text-forest-deep">{formatNGN(estimatedTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


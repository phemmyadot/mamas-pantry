"use client";

import mixpanel from "mixpanel-browser";

let initialized = false;

function init() {
  if (initialized || typeof window === "undefined") return;
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return;
  mixpanel.init(token, { persistence: "localStorage", ignore_dnt: false });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  init();
  if (!initialized) return;
  try {
    mixpanel.track(event, properties);
  } catch {}
}

export const Events = {
  ADD_TO_CART:    "Add to Cart",
  CHECKOUT_START: "Checkout Start",
  ORDER_PLACED:   "Order Placed",
} as const;

# Mama's Pantry — Todo

---

## Outstanding

- [ ] Run backend migrations: `cd backend && alembic upgrade head`

---

## Future Features

### Push Notifications (Firebase FCM)

- [ ] Backend: `FcmToken` model + migration
- [ ] Backend: `NotificationService` using FCM HTTP v1 API (service account OAuth2 via `google-auth`)
- [ ] Backend: `POST /notifications/subscribe` — register device token
- [ ] Backend: `POST /admin/notifications/broadcast` — send to all subscribers
- [ ] Backend: call `notify_order_status()` on order status change in `OrderService`
- [ ] Backend: `FIREBASE_PROJECT_ID` + `FIREBASE_SERVICE_ACCOUNT_JSON` env vars
- [ ] Web: Firebase SDK + service worker (`firebase-messaging-sw.js`)
- [ ] Web: `PushNotificationToggle` component in `/account`
- [ ] Web: `NEXT_PUBLIC_FIREBASE_*` env vars (apiKey, authDomain, projectId, etc.) + VAPID key
- [ ] Admin: Notifications page — broadcast form (title + body)
- [ ] Mobile (Rider + Customer): FCM token registration on login, deep-link from notification tap

---

## Rider App — React Native

### Setup

- [x] Init Expo project (`apps/rider/`) — React Native + TypeScript + Expo Router
- [x] Add to pnpm workspace
- [x] Configure API client (shared base URL, JWT bearer, auto-refresh on 401)
- [x] Auth context — store access/refresh tokens in SecureStore
- [x] Protect all routes — redirect to login if unauthenticated

### Auth

- [x] Login screen — email + password (rider accounts created by admin)
- [x] Auto-refresh token on app foreground

### Deliveries

- [x] Deliveries list screen — show assigned orders (status: out_for_delivery)
  - [x] Order card: order ID, customer name, delivery address, time assigned
  - [x] Pull-to-refresh
- [x] Order detail screen
  - [x] Items list with quantities
  - [x] Customer name and delivery address
  - [x] "Mark as Delivered" button (single allowed action)
  - [x] Confirmation modal before marking delivered
- [x] Mark as delivered — `PATCH /api/v1/riders/me/orders/{id}/delivered`

### Navigation

- [x] "Navigate" button on order detail — opens Google Maps / Apple Maps with delivery address
- [ ] Deep link from notification to order detail

### Push Notifications

- [ ] Register FCM token on login (`POST /notifications/subscribe`)
- [ ] Receive push when new delivery is assigned
- [ ] Tap notification → open relevant order detail

### Customer Verification

- [x] On arrival screen — show last 4 digits of customer phone for verbal confirmation

### Profile

- [x] Profile screen — name, phone, logout button
- [x] Active/inactive status display

---

## Customer Mobile App — React Native

### Setup

- [ ] Init Expo project (`apps/customer/`) — React Native + TypeScript + Expo Router
- [ ] Add to pnpm workspace
- [ ] Configure API client (shared base URL, JWT bearer, auto-refresh on 401)
- [ ] Auth context — store tokens in SecureStore
- [ ] Protect account/checkout/orders routes

### Auth

- [ ] Register screen — name, email, password, phone
- [ ] Login screen — email + password
- [ ] Email verification screen — prompt after register, resend link
- [ ] Password reset — request screen (email input) + confirm screen (new password)
- [ ] Persistent login — restore session from SecureStore on app launch

### Storefront

- [ ] Home screen
  - [ ] Hero banner with shipment teaser (when active US haul in transit)
  - [ ] Mum's Picks horizontal scroll (gold badge, "View all" CTA)
  - [ ] 4-tile category grid (Imported, Local, Chilled, Household) with product counts
  - [ ] Local Staples strip — 4 featured local products
  - [ ] Delivery zone info strip
  - [ ] How it works strip (3 steps)
- [ ] Shop screen — product grid
  - [ ] Category filter tabs (All / Imported / Local / Chilled / Household)
  - [ ] Mum's Pick toggle filter
  - [ ] Search bar
  - [ ] Sort (price, newest, popular)
- [ ] Product detail screen — image, price, compare price, origin badge, description, add to cart
- [ ] Mum's Picks screen — `GET /products?mums_pick=true` + shipment countdown widget
- [ ] Pre-order screen — upcoming shipment products, place pre-order

### Cart

- [ ] Persistent cart (AsyncStorage)
- [ ] Cart screen — line items, qty controls, promo code input, delivery fee, order total
- [ ] Cart badge on tab bar showing item count

### Checkout (3-step)

- [ ] Step 1: Address selector — saved addresses or new address form
- [ ] Step 2: Delivery time slot picker (Today 2–6 pm, Today 6–9 pm, Tomorrow AM, Tomorrow PM)
- [ ] Step 3: Order summary + promo code + Paystack payment
  - [ ] Paystack React Native SDK (WebView-based or native)
  - [ ] On success → clear cart + navigate to confirmation
  - [ ] On cancel → save order as unpaid, allow retry from order history
- [ ] Confirmation screen — order ID, estimated delivery, CTA to track

### Orders

- [ ] Order history screen — list with status badges
- [ ] Order detail screen — items, totals, status timeline, rider info (when out for delivery)
- [ ] Public order tracking screen — order ID + phone lookup (no login)

### Account

- [ ] Profile screen — name, email, edit profile
- [ ] Saved addresses — list, add new, set default, delete
- [ ] Order history (account-scoped)
- [ ] Pre-orders list — `GET /pre-orders/mine`
- [ ] Loyalty points balance + transaction history
- [ ] Push notification opt-in toggle
- [ ] Logout

### Push Notifications

- [ ] Register FCM token on login
- [ ] Receive order status change notifications
- [ ] Tap notification → open relevant order detail

### Delivery Info

- [ ] Static delivery info screen — zones, cut-off times, fees

---

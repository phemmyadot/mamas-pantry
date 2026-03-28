# Mama's Pantry — Build Todo
> Aligned to webapp_spec.pdf (v1.0). Spec defines 6 phases; we track by feature area.

---

## Monorepo Restructure ✅ COMPLETE

- [x] `pnpm-workspace.yaml` — workspaces: `apps/*`, `packages/*`
- [x] Root `package.json` — private workspace root, `dev:web`, `dev:admin`, `build:*`, `typecheck` scripts
- [x] `.npmrc` — `shamefully-hoist=false`, build approvals for esbuild/sharp/unrs-resolver
- [x] `.gitignore` — updated for monorepo paths
- [x] `apps/web/` (`@mamas-pantry/web`) — all Next.js source moved here, builds and typechecks clean
- [x] `packages/types/` (`@mamas-pantry/types`) — shared interfaces: Product, Order, User, Shipment, PreOrder, PromoCode
- [x] `ProductCategory` corrected to `imported|local|chilled|household`; `is_mums_pick` boolean added to Product type
- [x] `Order` type updated: `confirmed` status, `delivery_fee_ngn`, `payment_status`, `payment_ref`
- [x] `apps/web/lib/api.ts` — all domain types imported from `@mamas-pantry/types`
- [x] `apps/admin/` (`@mamas-pantry/admin`) — React 19 + Vite + TanStack Query + Recharts + React Router v7, brand tokens, proxy to `:8000`, builds clean
- [x] `backend/` stays at root, managed independently

---

## Phase 1 — Foundation ✅ COMPLETE

- [x] Tailwind v4 brand tokens (Forest Deep, Gold, Cream, Spice) + Google Fonts (Playfair Display, Lora, DM Sans)
- [x] API client — typed fetch wrapper, JWT bearer, auto-refresh on 401, RFC 7807 errors
- [x] Auth context — access/refresh token cookies, user state, login/logout, `isAuthenticated`
- [x] Route middleware — protect `/account`, `/checkout`, `/admin`; bounce authenticated users from auth pages
- [x] Auth UI — Register, Login, Password Reset (request + confirm) pages
- [x] Verify-phone page (built for OTP; switched to email verification — page still exists)

---

## Phase 2 — Backend Schema Revisions (needed before continuing)

> Spec defines different categories and additional fields/tables vs what was built in phase 2.

### Products model changes
- [x] Change `ProductCategory` enum from `mums_pick|local|imported` → `imported|local|chilled|household`
- [x] Add `is_mums_pick` boolean field (independent of category — a product can be `imported` AND `is_mums_pick=true`)
- [x] Add `slug` field (unique, URL-safe, used for routing: `/shop/[slug]`)
- [x] Add `compare_price` field (Numeric, nullable — for strikethrough pricing)
- [x] Add `origin` field (string, e.g. "USA", "Nigeria")
- [x] Add `images` field (array of URLs, replaces single `image_url`)
- [x] Write Alembic migration for all product changes (`0002_schema_revisions.py`)
- [ ] Run migration: `cd backend && alembic upgrade head`

### Orders model changes
- [x] Add `CONFIRMED` to `OrderStatus` enum (full set: PENDING → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED | CANCELLED)
- [x] Add `delivery_fee` field (Numeric)
- [x] Add `payment_status` field (enum: unpaid | paid | failed)
- [x] Add `payment_ref` field (Paystack reference, nullable string)
- [x] Add `rider_id` FK (nullable, links to riders table)
- [x] Add `notes` field (nullable text)
- [x] Write Alembic migration for order changes (same `0002` file)

### New tables
- [x] `addresses` — user saved delivery addresses (id, user_id, label, street, area, city, is_default). Magodo Phase 1 pre-filled as default on register
- [x] `shipments` — US import shipment tracker (id, name, origin_country, departure_date, arrival_date, status, notes)
- [x] `pre_orders` — customer pre-orders (id, user_id, product_id, shipment_id, quantity, status)
- [x] `riders` — dispatch riders (id, name, phone, is_active, current_lat, current_lng)
- [x] `loyalty_transactions` — points earned/redeemed (id, user_id, order_id, points, type [EARN|REDEEM|EXPIRE], description)
- [x] `promo_codes` — discount codes (id, code, discount_type [PERCENTAGE|FIXED], discount_value, min_order, max_uses, used_count, expires_at)
- [x] Write Alembic migration for all new tables (same `0002` file)

### New API endpoints
- [x] `GET /api/v1/products/featured` — returns `is_mums_pick=true` products (for homepage)
- [x] `GET /api/v1/products?mums_pick=true` — add `mums_pick` boolean filter to existing list endpoint
- [x] `GET /api/v1/categories` — returns 4 categories with product count each
- [x] `GET /api/v1/shipments` — upcoming and recent shipments (public)
- [x] `GET /api/v1/shipments/{id}/products` — products available for pre-order on this shipment (public)
- [x] `POST /api/v1/pre-orders` — place a pre-order (auth)
- [x] `GET /api/v1/pre-orders/mine` — customer's active pre-orders (auth)
- [x] `POST /api/v1/admin/shipments` — create shipment record (admin)
- [x] `PATCH /api/v1/admin/shipments/{id}` — update shipment status and arrival date (admin)
- [x] `POST /api/v1/admin/orders/{id}/assign-rider` — assign rider to order (staff)
- [x] `POST /api/v1/orders/webhook/paystack` — Paystack payment webhook, verify HMAC-SHA512 signature, update payment_status
- [x] `GET /api/v1/admin/dashboard` — KPI summary: today's revenue, order counts, low-stock alerts, weekly chart data (single call, no waterfall)
- [x] `GET /api/v1/admin/customers` — paginated customer list with order count and total spend
- [x] `GET /api/v1/admin/analytics` — revenue by date range, top products, category breakdown
- [x] `POST /api/v1/admin/promo-codes` — create promo code
- [x] `GET /api/v1/admin/inventory/low-stock` — products below reorder threshold

---

## Phase 3 — Customer MVP (storefront pages)

> Partially built in phase 3 of previous work. Several pages need revisions per spec.

### Already built (may need revision)
- [x] Storefront layout — sticky header, footer (Magodo Phase 1), cart drawer
- [x] Cart context — localStorage, addItem/removeItem/updateQty, drawer open/close state
- [x] ProductCard component — image, badge, price, add-to-cart
- [x] `/shop` — product grid, category filter, search bar *(needs: Chilled/Household categories, Mum's Pick toggle filter, sort by price/newest/popular)*
- [x] `/products/[id]` — product detail with qty selector, add-to-cart *(needs: route by slug → `/shop/[slug]`, image gallery, related products, origin badge)*
- [x] `/checkout` — delivery form, order summary, POST /orders *(needs: 3-step flow, Paystack, time slot picker)*
- [x] `/checkout/confirmation` — order confirmation

### Homepage revisions needed
- [x] Update hero headline to "From our hands to your table" with shipment teaser banner ("Mum just landed — new stock in") when active shipment exists
- [x] Add Mum's Picks horizontal scroll section (5-6 cards, gold badge, "View all" → `/mums-picks`)
- [x] Replace category chips with 4-tile category grid (Imported, Local, Chilled, Household) with icon and product count from `GET /categories`
- [x] Add "Local Staples" strip — 4 featured local products, visually distinct from imported section
- [x] Add delivery zone section — list of covered areas (Magodo Phase 1, Phase 2, Alapere, Ketu, Ojota)
- [x] Add "How it works" strip — 3 steps: Browse → Order → Delivered to your gate

### New storefront pages
- [x] `/cart` — dedicated cart page: line items, qty controls, promo code input field, delivery fee calculation, order summary, Paystack CTA
- [x] `/orders` — customer order history: list of past and active orders with status timeline badges
- [x] `/orders/[id]` — order detail: items, rider tracking link, status timeline, receipt download
- [x] `/mums-picks` — dedicated Mum's Pick page: `GET /products?mums_pick=true`, shipment countdown widget (days until next US arrival)
- [x] `/pre-order` — browse upcoming shipment products (`GET /shipments` + `GET /shipments/{id}/products`), place pre-order (`POST /pre-orders`)
- [x] `/track/[id]` — public order tracking (no login): verify by order ID + phone number, show status timeline
- [x] `/delivery` — delivery info static page (zones, cut-off times, fees) *(referenced in header nav)*

### Account pages
- [x] `/account` — profile overview: name, email, nav cards to sub-pages
- [x] `/account/addresses` — manage saved delivery addresses (list, add new, set default, delete)
- [x] `/account/orders` — order history list (mirrors `/orders` but scoped to account section)
- [x] `/account/pre-orders` — customer's active pre-orders (`GET /pre-orders/mine`)

### Checkout revisions (3-step flow per spec)
- [x] Step 1: Address selector (saved addresses or new address form with area dropdown)
- [x] Step 2: Delivery time slot picker (Today 2–6 pm, Today 6–9 pm, Tomorrow AM, Tomorrow PM). Today slots disabled after cut-off
- [x] Step 3: Order summary + promo code field + Paystack inline payment button
- [x] On Paystack success: redirect to `/checkout/confirmation?order=ID`
- [x] On Paystack cancel: redirect to confirmation (order saved as unpaid, retry from order history)

### Paystack integration
- [x] Paystack script tag injected via `useEffect`. `window.PaystackPop.setup()` used for inline popup
- [x] Wire Paystack public key from `NEXT_PUBLIC_PAYSTACK_KEY` env var (gracefully skips if unset)

### Public order tracking (backend)
- [x] `GET /api/v1/orders/track/{id}?phone=` — public endpoint, verifies last-10-digits of phone against delivery address

---

## Phase 4 — Admin Dashboard MVP ✅ COMPLETE

> Builds inside `apps/admin/` (`@mamas-pantry/admin`) — standalone Vite SPA on port 5173.

### Layout & auth
- [x] Admin layout — collapsible left sidebar (forest-deep), top bar with store name + logged-in user. Nav: Dashboard, Orders, Inventory, Shipments, Customers, Riders, Promos, Analytics
- [x] Admin auth guard — redirect non-admin/staff users to `/login`; STAFF role cannot access Customers or Analytics pages

### Admin pages
- [x] `/dashboard` — KPI cards (Today's Revenue ₦, Active Orders, Low Stock, New Customers), Weekly Revenue bar chart (Recharts, Saturday bar in Harvest Gold), Recent Orders table (last 10)
- [x] `/orders` — paginated, filterable orders table (status filter tabs). Pulsing gold dot on nav for PENDING orders
- [x] `/orders/:id` — full order detail: status update dropdown, rider assign, delivery address, items table, totals, 5-step timeline
- [x] `/inventory` — product table: stock qty (red row if ≤3), price, active toggle, edit link. Category + search filters
- [x] `/inventory/new` — product creation form: name, slug (auto-generated), description, price, compare_price, image_url, category, origin, badge, is_mums_pick, stock_qty, is_active
- [x] `/inventory/:id` — edit product (same form, pre-filled)
- [x] `/shipments` — US import shipment tracker: create + edit shipments (name, dates, status)
- [x] `/customers` — paginated customer table: name, email, orders count, total spend, joined date
- [x] `/analytics` — revenue chart (7/30/90-day toggle), top 10 products table, category pie chart (Recharts)
- [x] `/riders` — riders list with active/inactive toggle, add new rider form
- [x] `/promos` — active and expired promo codes, create new code (type, value, min order, max uses, expiry), usage count per code

### Backend additions (Phase 4)
- [x] `GET /api/v1/admin/orders/{id}` — get single order by ID (admin)
- [x] `Order` type updated: added `rider_id` field

---

## Phase 5 — Mum's Picks & Pre-Order ✅ COMPLETE

- [x] `ShipmentCountdown` component — reusable server component, shows days until arrival, "Pre-order →" CTA. Used on `/mums-picks` and homepage
- [x] Mum's Picks page fully wired to `GET /products/featured` + `ShipmentCountdown`
- [x] Pre-order flow — browse shipment products by selector tab, place pre-order, inline success confirmation; admin manages via `/shipments`
- [x] Homepage shipment teaser banner — shown when `status === "in_transit"` OR `arrival_date` within 7 days
- [x] Homepage countdown widget — shown in hero area when active shipment is upcoming (> 7 days out)

---

## Phase 6 — Growth Features ✅ COMPLETE

- [x] Loyalty points — `LoyaltyService`: earn 1 pt per ₦100 on delivery, `GET /loyalty/me` balance endpoint. `LoyaltyPointsDisplay` component in `/account` shows pts + ₦ value + transaction history
- [x] Promo codes — checkout already sends promo code to `POST /orders`; backend validates and applies discount inline; total_ngn reflects discount
- [x] Push notifications — `FcmToken` model + migration 0003; `NotificationService` (FCM legacy HTTP); `POST /notifications/subscribe`; `POST /admin/notifications/broadcast`; auto-notify on order status change; `PushNotificationToggle` in `/account`; `firebase-messaging-sw.js` service worker; admin `/notifications` page; requires `FCM_SERVER_KEY` + `NEXT_PUBLIC_FIREBASE_*` env vars
- [x] Public order tracking — `GET /api/v1/orders/track/{id}?phone=` (Phase 3); `/track/[id]` storefront page (Phase 3)
- [x] Rider assignment — admin order detail has rider dropdown (Phase 4); `PATCH /admin/riders/{id}/location` endpoint for bot/mobile location updates

---

## Phase 7 — Polish & Launch

- [ ] SEO — `generateMetadata` on all product pages (title, description, OG image via Cloudinary). Homepage structured data: `LocalBusiness` schema (address, hours, delivery areas)
- [ ] Product pages: `Product` structured data schema (price, availability, image)
- [ ] `sitemap.xml` — auto-generated via `next-sitemap`. Includes all products and category pages. Exclude `/checkout`, `/cart`, `/account`, `/admin`
- [ ] `robots.txt` — disallow `/admin`, `/api`, `/checkout`, `/cart`, `/account`
- [ ] Performance — convert `<img>` tags to `next/image` with explicit width/height (CLS). LCP target < 2.5s. Lighthouse ≥ 90 on mobile homepage
- [ ] Cloudinary integration — upload product images to Cloudinary, store only CDN URLs in DB, use Cloudinary transformations for responsive sizes
- [ ] Analytics — Vercel Analytics enabled; Mixpanel events for add-to-cart, checkout start, order placed

---

## Config & Data (ongoing)

- [x] Backend `.env` — CORS origins, JWT secret, Gmail SMTP for email verification
- [x] Alembic migrations run (initial auth schema + products + orders)
- [x] Seed roles (super_admin, admin, user)
- [ ] Run new Alembic migrations after schema changes above
- [ ] Seed product catalogue — sample products across all 4 categories (Imported, Local, Chilled, Household), some with `is_mums_pick=true`, with ₦ prices, slugs, and origin fields
- [ ] Create at least one test shipment record for pre-order/countdown UI development
- [ ] Add `NEXT_PUBLIC_PAYSTACK_KEY` to frontend `.env.local`

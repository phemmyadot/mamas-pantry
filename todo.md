# Mama's Pantry — Build Todo

## Foundation

- [x] Read Next.js 16 docs in `node_modules/next/dist/docs/` before writing any code (required by AGENTS.md)
- [x] Configure Tailwind v4 with brand tokens (Forest Deep `#1B4332`, Harvest Gold `#D4A017`, Market Spice `#C4622D`, Warm Cream `#FEFAE0`) and Google Fonts (Playfair Display, Lora, DM Sans)
- [x] Create API client — typed fetch wrapper with JWT bearer header, automatic token refresh via `/auth/refresh`, and RFC 7807 error handling
- [x] Create auth context/store — persist access + refresh tokens, expose user state, login/logout helpers, `isAuthenticated` flag

## Auth UI — Standard / Phone OTP

- [x] Build Register page — email + password form, `POST /auth/register`, redirect to phone verification
- [x] Build Login page — email + password form, `POST /auth/login`, store tokens, redirect to home (or `/verify-phone` if unverified)
- [x] Build Phone OTP pages — (1) enter phone + send OTP via `POST /auth/phone/send-otp`; (2) enter 6-digit code + verify via `POST /auth/phone/verify-otp`; show resend countdown (3/hr limit)
- [x] Build Password Reset pages — (1) request form (`POST /auth/password-reset/request`); (2) confirm form with token from email link (`POST /auth/password-reset/confirm`)
- [x] Implement route middleware — redirect unauthenticated users to `/login`; redirect verified users away from auth pages

## Backend Extensions

- [x] Add `Product` model (name, description, price_ngn, category enum [`mums_pick`, `local`, `imported`], badge, image_url, stock_qty, is_active) + Alembic migration
- [x] Add Products API — `GET /products` (filterable by category, search), `GET /products/{id}`, `POST`/`PATCH`/`DELETE /admin/products` (admin only)
- [x] Add `Order` + `OrderItem` models (order: user_id, status enum [`pending`, `packed`, `out_for_delivery`, `delivered`, `cancelled`], total_ngn, delivery_address; items: product_id, qty, unit_price) + migration
- [x] Add Orders API — `POST /orders`, `GET /orders/me`, `GET /admin/orders` (paginated, filterable by status), `PATCH /admin/orders/{id}/status`

## Public Storefront

- [ ] Build storefront layout — header (logo, nav: Shop / Mum's Picks / Local / Delivery, cart icon with item count), footer (Magodo Phase 1 Lagos, tagline)
- [ ] Build Homepage — hero ("From our hands to your table"), "Just landed" 4-up product grid, category chips, CTA button
- [ ] Build Shop / product listing page — category filter tabs, product cards (image, badge [Mum's Pick / Local / New Arrival], name, ₦ price, add-to-cart), search bar
- [ ] Build Product detail page — image, name, badge, ₦ price, description, qty selector, add-to-cart button
- [ ] Build Cart — slide-out drawer, line items with qty stepper, order total in ₦, checkout CTA (requires auth)
- [ ] Build Checkout flow — delivery address form, order summary, `POST /orders`; show confirmation with order number
- [ ] Build customer Account pages — profile (`GET`/`PATCH /users/me`), order history list, order detail with status badge

## Admin Dashboard

- [ ] Build Admin layout — dark-green sidebar (Dashboard, Orders, Inventory, Customers, Analytics, Settings), top bar with date
- [ ] Build Admin Dashboard overview — stat cards (Today's Revenue ₦, Orders count, Low Stock alert), Recent Orders table, Weekly Sales bar chart
- [ ] Build Admin Orders page — paginated table, status filter, inline status update (Packed / Out for Delivery / Delivered / Cancelled)
- [ ] Build Admin Inventory page — product table with stock qty, add/edit product form (name, ₦ price, category, badge, image, stock), low-stock highlight
- [ ] Build Admin Customers page — `GET /admin/users`, paginated table, ban/unban actions
- [ ] Build Admin Audit Logs page — `GET /admin/audit-logs`, filterable by event type and date range

## Config & Data

- [ ] Wire backend `.env` — set `CORS_ORIGINS` to Next.js dev URL, confirm Twilio credentials for OTP, set `JWT_SECRET`
- [ ] Run Alembic migrations (initial auth + products + orders) against local PostgreSQL
- [ ] Seed product catalogue — sample products across Mum's Picks, Local Staples, and Imported categories with ₦ prices

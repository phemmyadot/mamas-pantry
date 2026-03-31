# Code Quality & Security Audit

> Generated 2026-03-31. Issues found across `apps/web`, `apps/admin`, and `backend`.

---

## High Severity

- [x] **`.env` committed with real credentials** — not tracked in git (confirmed). Rotate secrets before production deploy.
- [x] **File upload exposes exception detail** — fixed: logs via `logger.exception`, returns generic `"Image upload failed"`. | `backend/app/api/v1/products/router.py`
- [x] **Paystack webhook accepts requests when `PAYSTACK_SECRET_KEY` is unset** — fixed: early `raise ValidationError` if secret is empty. | `backend/app/services/order_service.py`
- [x] **No rate limit on public order tracking endpoint** — fixed: `@limiter.limit("20/minute")` added. | `backend/app/api/v1/orders/router.py`
- [x] **File upload has no size cap** — fixed: reads max 5 MB + 1 byte, raises HTTP 413 if exceeded. | `backend/app/api/v1/products/router.py`
- [x] **Auth cookies missing `Secure` flag** — fixed: `Secure` flag added when `window.location.protocol === "https:"`. | `apps/web/lib/api.ts`
- [x] **Silent `except: pass` on email verification send** — fixed: logs warning with stack trace via `logger.warning(..., exc_info=True)`. | `backend/app/api/v1/auth/router.py`
- [x] **Phone normalization accepts non-digits** — not an issue: `compact.isdigit()` check on line 32 already rejects non-digit strings.
- [x] **SVG/HTML uploadable via spoofed MIME type** — fixed: magic-byte detection (`_detect_mime`) replaces header trust. | `backend/app/api/v1/products/router.py`
- [x] **Unhandled `JSONDecodeError` in Paystack webhook** — fixed: `json.loads` wrapped in `try/except json.JSONDecodeError`. | `backend/app/services/order_service.py`

---

## Medium Severity

- [ ] **No React error boundaries in admin app** — any unhandled query error renders a blank screen. Add an `ErrorBoundary` wrapper around page routes. | `apps/admin/src/`
- [ ] **`OrdersPage` loads all orders into memory** — paginated fetch loop has no hard cap; crashes on large datasets. Add a max-records guard. | `apps/admin/src/pages/OrdersPage.tsx:23`
- [ ] **Order status transitions have no state machine** — any status can transition to any other (e.g. `delivered → pending`). Enforce forward-only transitions in `OrderService`. | `backend/app/api/v1/orders/router.py:150`
- [ ] **Silent `except: pass` on order status change email** — failure is never logged; customer misses critical status updates. | `backend/app/services/order_service.py:322`
- [ ] **Missing DB indexes on high-traffic foreign keys** — `Order.user_id`, `Product.category`, `AuditLog.user_id` have no explicit indexes. Add via Alembic migration. | `backend/app/db/models/`
- [ ] **`ProductFormPage` shows no error when product 404s** — form renders silently empty/broken. Handle query error state. | `apps/admin/src/pages/ProductFormPage.tsx:40`
- [ ] **No client-side file size check before upload** — large files are sent to the server unnecessarily. Validate `file.size` before calling `uploadImage`. | `apps/admin/src/lib/api.ts`
- [ ] **Delivery address `area` is optional but controls fee** — `NULL` area silently bypasses zone fee lookup. Make `area` required for delivery orders. | `backend/app/schemas/order.py:20`
- [ ] **Token refresh not safe across browser tabs** — parallel tabs can race on refresh and desync stored tokens. Use `BroadcastChannel` or a shared lock. | `apps/web/lib/api.ts` · `apps/admin/src/lib/api.ts`
- [ ] **Some `emit_audit_log()` calls omit `user_id`** — incomplete audit trail makes incident investigation harder. | `backend/app/api/v1/auth/router.py:143,194`
- [ ] **No global error boundary in customer web app** — unhandled render errors crash the whole page. | `apps/web/`
- [ ] **`verifyEmail` returns `{ detail: string }`** — inconsistent with the rest of the API response shapes; tighten the type. | `apps/web/lib/api.ts:185`
- [ ] **No prominent error state on `createMutation` / `updateMutation` failure in `ProductFormPage`** — errors silently fail without visible feedback. | `apps/admin/src/pages/ProductFormPage.tsx`
- [ ] **Race condition on auth token refresh across browser tabs** — same issue as web, affects admin SPA independently. | `apps/admin/src/lib/api.ts:42`
- [ ] **No forward-only status validation on customer-facing order updates** — service layer allows arbitrary status jumps. | `backend/app/services/order_service.py`

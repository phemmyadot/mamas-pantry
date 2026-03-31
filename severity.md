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

- [x] **No React error boundaries in admin app** — fixed: `ErrorBoundary` class component wraps `AdminLayout` in `App.tsx`. | `apps/admin/src/components/ErrorBoundary.tsx`
- [x] **`OrdersPage` loads all orders into memory** — fixed: `MAX_FETCH_RECORDS = 2000` guard added to fetch loop. | `apps/admin/src/pages/OrdersPage.tsx`
- [x] **Order status transitions have no state machine** — fixed: `_ALLOWED_TRANSITIONS` map enforced in `update_status` before any other checks. | `backend/app/services/order_service.py`
- [x] **Silent `except: pass` on order status change email** — fixed: logs warning with stack trace via `logger.warning(..., exc_info=True)`. | `backend/app/services/order_service.py`
- [x] **Missing DB indexes on high-traffic foreign keys** — not an issue: `index=True` already declared on all three columns and created in migration 0001. | `backend/app/db/models/`
- [x] **`ProductFormPage` shows no error when product 404s** — fixed: `isError` from `useQuery` renders a friendly error state; `retry: false` prevents unnecessary retries. | `apps/admin/src/pages/ProductFormPage.tsx`
- [x] **No client-side file size check before upload** — fixed: `handleFileSelect` rejects files > 5 MB before any upload. | `apps/admin/src/pages/ProductFormPage.tsx`
- [x] **Delivery address `area` is optional but controls fee** — fixed: `model_validator` on `OrderCreate` raises if `fulfillment_type == delivery` and `area` is absent. | `backend/app/schemas/order.py`
- [x] **Token refresh not safe across browser tabs** — fixed: `BroadcastChannel("web_auth")` + lock cookie in web; `BroadcastChannel("admin_auth")` + localStorage lock in admin. Within-tab `refreshPromise` deduplication added to web. | `apps/web/lib/api.ts` · `apps/admin/src/lib/api.ts`
- [x] **Some `emit_audit_log()` calls omit `user_id`** — fixed: `logout` and `confirm_password_reset` now return `user_id`; audit calls updated. | `backend/app/api/v1/auth/router.py` · `backend/app/services/auth_service.py`
- [x] **No global error boundary in customer web app** — fixed: `apps/web/app/error.tsx` added as Next.js root error boundary. | `apps/web/app/error.tsx`
- [x] **`verifyEmail` returns `{ detail: string }`** — fixed: changed to `apiFetch<void>` to match API contract. | `apps/web/lib/api.ts`
- [x] **No prominent error state on `createMutation` / `updateMutation` failure in `ProductFormPage`** — not an issue: `onError: (e) => setError(e.message)` already wired; error displays below form. | `apps/admin/src/pages/ProductFormPage.tsx`
- [x] **Race condition on auth token refresh across browser tabs** — fixed: same `BroadcastChannel` + lock fix above covers admin SPA. | `apps/admin/src/lib/api.ts`
- [x] **No forward-only status validation on customer-facing order updates** — fixed: same `_ALLOWED_TRANSITIONS` enforcement covers all callers of `update_status`. | `backend/app/services/order_service.py`

# Mama's Pantry

Nigerian grocery e-commerce platform serving Magodo Phase 1, Lagos. Specialises in imported goods (US hauls), local produce, chilled items, and household essentials.

---

## Monorepo Structure

```
mamas-pantry/
├── apps/
│   ├── web/          # Customer storefront — Next.js on :3000
│   └── admin/        # Admin/staff SPA — Vite + React on :5173
├── packages/
│   └── types/        # Shared TypeScript types
└── backend/          # FastAPI + PostgreSQL on :8000
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Customer web | Next.js, Tailwind v4, TypeScript |
| Admin SPA | Vite, React 19, TanStack Query, React Router v7, Recharts |
| Backend API | FastAPI, SQLAlchemy (async), Alembic, PostgreSQL |
| Auth | JWT (access + refresh), email verification |
| Payments | Paystack inline SDK |
| Image storage | Cloudflare R2 (S3-compatible via boto3) |
| Analytics | Mixpanel + Vercel Analytics |
| Package manager | pnpm workspaces |

---

## Prerequisites

- Node.js 20+, pnpm 9+
- Python 3.12+
- PostgreSQL 15+

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env        # fill in values (see Environment Variables below)
alembic upgrade head        # run all migrations
python app/scripts/seed_admin.py    # create super_admin user
python app/scripts/seed_catalogue.py  # optional: seed 20 sample products
```

### 3. Run everything

From the repo root:

```bash
# Terminal 1 — backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2 — customer web
pnpm dev:web

# Terminal 3 — admin SPA
pnpm dev:admin
```

| App | URL |
|---|---|
| Customer storefront | http://localhost:3000 |
| Admin dashboard | http://localhost:5173 |
| API + docs | http://localhost:8000/docs |

---

## Root Scripts

```bash
pnpm dev:web          # start customer web
pnpm dev:admin        # start admin SPA
pnpm build:web        # production build — web
pnpm build:admin      # production build — admin
pnpm typecheck        # typecheck all packages
pnpm lint             # lint all packages
```

Per-app test:

```bash
pnpm --filter @mamas-pantry/web test
pnpm --filter @mamas-pantry/admin test
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL async URL (`postgresql+asyncpg://...`) |
| `JWT_SECRET` | Secret for signing JWTs |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `SMTP_HOST/PORT/USER/PASSWORD` | Gmail SMTP for transactional email |
| `EMAIL_FROM` | From address for system emails |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (webhook HMAC verification) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name (e.g. `example-images`) |
| `R2_PUBLIC_URL` | Public R2 URL (e.g. `https://pub-xxx.r2.dev`) |
| `ADMIN_EMAIL/PASSWORD/USERNAME` | Seed admin credentials |

### Customer web (`apps/web/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_PAYSTACK_KEY` | Paystack public key (inline popup) |

---

## Key Domain Rules

- **Categories:** Imported, Local, Chilled, Household
- **Product URLs** use slug, not ID: `/shop/[slug]`
- **Order lifecycle:** PENDING → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED | CANCELLED
- **Checkout:** 3 steps — address select → delivery time slot → Paystack payment
- **Roles:** `super_admin` (store owner), `admin` / `staff`, `user` (customer), `rider`
- **Delivery zones:** Magodo Phase 1 & 2, Alapere, Ketu, Ojota

---

## Features

- Full customer storefront: shop, cart, 3-step checkout, Paystack, order tracking
- Imports shipment tracker + pre-order flow
- Admin dashboard: orders, inventory, shipments, customers, riders, promos, analytics
- Staff roles + in-store POS flow with barcode (SKU) scanning
- Staff performance metrics (daily orders, revenue, time-per-item)
- Delivery fee configuration per zone
- Loyalty points (1 pt per ₦100 on delivery)
- Promo codes (percentage or fixed discount)
- Order status emails to customers (via Gmail SMTP)
- Product image upload to Cloudflare R2
- SEO: `generateMetadata`, JSON-LD structured data, sitemap, robots.txt
- Public order tracking (no login — order ID + phone)

---

## Upcoming

### Rider App (React Native)
- View list of assigned deliveries
- Mark orders as delivered
- Navigation to delivery address
- Customer identity verification

### Customer Mobile App (React Native)
- Full feature parity with the customer web storefront

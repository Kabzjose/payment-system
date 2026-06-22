# Payment System

A full-stack payment backend and dashboard supporting Stripe card payments, M-Pesa mobile money, and recurring subscriptions — built with Node.js, Express, TypeScript, PostgreSQL, and React.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Reference](#api-reference)
- [Frontend](#frontend)
- [Admin Dashboard](#admin-dashboard)
- [Webhooks](#webhooks)
- [M-Pesa Integration](#m-pesa-integration)
- [Subscriptions](#subscriptions)
- [Deployment](#deployment)
- [Security](#security)

---

## Overview

This project is a production-grade payment system that supports two payment rails commonly used in Kenya and other African markets:

- **Stripe** — international card payments with full webhook handling, refunds, and recurring subscriptions
- **M-Pesa (Daraja API)** — Safaricom mobile money via STK push, with async callback handling

The system includes a user-facing dashboard, a full admin panel with user management, and a layered backend architecture that separates routing, business logic, and data access cleanly.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL (via `pg` pool) |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Logging | Pino |
| Payments | Stripe SDK v17, Daraja REST API |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Payments | Stripe.js + @stripe/react-stripe-js |
| Fonts | Spectral (serif), IBM Plex Mono |

### Infrastructure
| Service | Provider | Plan |
|---|---|---|
| Backend hosting | Render | Free |
| Database | Neon (Postgres) | Free |
| Frontend hosting | Vercel | Free |

---

## Architecture

The backend follows a strict layered architecture. Every request travels through the same pipeline:

```
HTTP Request
     ↓
Express middleware (helmet, cors, rate limiting, body parsing)
     ↓
Auth middleware (JWT verification)
     ↓
Validation middleware (Zod schema)
     ↓
Controller (reads req, calls service, sends res)
     ↓
Service (business logic — no HTTP knowledge)
     ↓
Repository (raw SQL — no business logic)
     ↓
PostgreSQL
```

Each layer has one responsibility. Services never write SQL. Repositories never know about HTTP. Controllers never contain business logic. This makes every layer independently testable and replaceable.

---

## Features

### Payments
- Stripe card payments using the PaymentIntent lifecycle
- M-Pesa STK push with async callback handling
- Full and partial refunds (Stripe)
- Idempotent payment processing
- Unified payment history across both rails

### Subscriptions
- Plan management synced from Stripe Product/Price objects
- Subscribe, cancel (immediate or at period end), and upgrade/downgrade
- Automatic proration on plan changes
- Webhook-driven status updates for full lifecycle tracking

### Webhooks
- Stripe signature verification on every event
- Idempotency via `webhook_events` table (duplicate events ignored)
- Handles 9 event types across payments and subscriptions
- M-Pesa async callback processing

### Auth
- JWT-based stateless authentication
- bcrypt password hashing (12 salt rounds)
- Admin role with separate middleware protection
- Account suspension system

### Admin Dashboard
- Revenue stats (Stripe + M-Pesa combined)
- All payments across all users with search and filter
- All users with payment totals and subscription status
- Per-user detail with full payment and subscription history
- Admin refund (issue refunds on behalf of users)
- Admin subscription cancellation
- User suspension and unsuspension

---

## Project Structure

```
payment-system/
├── server/                          # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts               # Environment variable validation
│   │   │   ├── database.ts          # pg Pool setup
│   │   │   ├── stripe.ts            # Stripe SDK singleton
│   │   │   ├── mpesa.ts             # M-Pesa helpers (password, timestamp, phone)
│   │   │   └── migrate.ts           # Migration runner
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # JWT verification → req.user
│   │   │   ├── admin.middleware.ts  # is_admin DB check
│   │   │   ├── validate.middleware.ts # Zod request body validation
│   │   │   └── error.middleware.ts  # Global error handler
│   │   ├── modules/
│   │   │   ├── auth/                # register, login
│   │   │   ├── users/               # user repository
│   │   │   ├── payments/            # Stripe PaymentIntent flows
│   │   │   ├── mpesa/               # Daraja STK push + callback
│   │   │   ├── subscriptions/       # Plans + recurring billing
│   │   │   ├── webhooks/            # Stripe event handlers
│   │   │   └── admin/               # Admin-only endpoints
│   │   ├── types/
│   │   │   └── index.ts             # Shared TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── errors.ts            # AppError class
│   │   │   └── logger.ts            # Pino logger
│   │   ├── app.ts                   # Express app setup
│   │   └── server.ts                # Entry point
│   ├── migrations/                  # Numbered SQL migration files
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_customers.sql
│   │   ├── 003_create_payment_intents.sql
│   │   ├── 004_create_transactions.sql
│   │   ├── 005_create_webhook_events.sql
│   │   ├── 006_updated_at_trigger.sql
│   │   ├── 007_create_mpesa_payments.sql
│   │   ├── 008_create_plans.sql
│   │   ├── 009_create_subscriptions.sql
│   │   ├── 010_add_admin_flag.sql
│   │   └── 011_add_user_suspension.sql
│   ├── package.json
│   └── tsconfig.json
│
└── client/                          # React frontend
    ├── src/
    │   ├── lib/
    │   │   ├── api.ts               # All API calls in one typed object
    │   │   ├── auth.tsx             # Auth context + useAuth hook
    │   │   ├── stripe.ts            # Stripe.js singleton
    │   │   └── format.ts            # Money, date, status formatters
    │   ├── hooks/
    │   │   ├── usePayments.ts       # Fetches Stripe + M-Pesa payment lists
    │   │   ├── useSubscription.ts   # Fetches user's active subscription
    │   │   ├── useMpesaPolling.ts   # Polls M-Pesa payment status every 3s
    │   │   └── useAdminData.ts      # Fetches admin stats
    │   ├── components/
    │   │   ├── AuthScreen.tsx       # Login + register
    │   │   ├── Dashboard.tsx        # Main dashboard with 4 tabs
    │   │   ├── StatusPill.tsx       # Colored status badge
    │   │   ├── tabs/
    │   │   │   ├── CardTab.tsx      # Stripe Elements payment form
    │   │   │   ├── MpesaTab.tsx     # STK push form + polling UI
    │   │   │   ├── HistoryTab.tsx   # Unified payment history
    │   │   │   └── SubscriptionTab.tsx # Pricing + subscription management
    │   │   ├── modals/
    │   │   │   ├── StripeDetail.tsx # Payment detail + refund
    │   │   │   └── MpesaDetail.tsx  # M-Pesa payment detail
    │   │   └── admin/
    │   │       ├── StatsRow.tsx         # Four stat cards
    │   │       ├── PaymentsTable.tsx    # All payments with search/filter
    │   │       ├── UsersTable.tsx       # All users with detail modal
    │   │       └── SubscriptionBreakdown.tsx # Plan distribution chart
    │   ├── pages/
    │   │   └── AdminPage.tsx        # Admin dashboard page
    │   ├── App.tsx                  # Root — routes based on isAdmin
    │   ├── main.tsx                 # Vite entry point
    │   └── index.css                # Tailwind + font imports
    ├── package.json
    └── vite.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (local) or a Neon account (cloud)
- Stripe account (test mode)
- Safaricom Daraja account (sandbox)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/payment-system.git
cd payment-system
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd client
npm install
```

### 4. Set up environment variables

```bash
cd server
cp .env.example .env
# Edit .env with your values — see Environment Variables section below
```

### 5. Run database migrations

```bash
cd server
npm run migrate
```

### 6. Start the backend

```bash
npm run dev
# Server running on http://localhost:3000
```

### 7. Start the frontend

```bash
cd client
npm run dev
# App running on http://localhost:5173
```

### 8. Make yourself an admin

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

Then navigate to `http://localhost:5173` — you'll be redirected to `/admin` automatically after login.

---

## Environment Variables

Create `server/.env` using this template:

```env
# Server
NODE_ENV=development
PORT=3000

# Database — use DATABASE_URL for cloud (Neon), individual vars for local
DATABASE_URL=                        # e.g. postgresql://user:pass@host/db?sslmode=require
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payment_db
DB_USER=postgres
DB_PASSWORD=your_password

# Auth
JWT_SECRET=your_long_random_secret   # generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# M-Pesa (Daraja)
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9...
MPESA_CALLBACK_URL=https://your-domain.com/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox            # or 'production'

# Frontend (for CORS)
FRONTEND_URL=http://localhost:5173
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Database

### Running migrations

```bash
cd server
npm run migrate
```

Migrations are idempotent — safe to run multiple times. Already-applied migrations are skipped.

### Schema overview

| Table | Purpose |
|---|---|
| `users` | Registered users with auth credentials and admin/suspension flags |
| `customers` | Stripe customer records linked to users (1-to-1) |
| `payment_intents` | Stripe payment attempts with full status lifecycle |
| `transactions` | Settled financial events (charges, refunds) |
| `webhook_events` | Every Stripe webhook received — used for idempotency |
| `mpesa_payments` | M-Pesa STK push records with callback results |
| `plans` | Available subscription plans synced from Stripe |
| `subscriptions` | User subscriptions with full Stripe lifecycle tracking |
| `migrations` | Tracks which migration files have been applied |

### Key design decisions

**Amounts stored as integers** — Stripe amounts are stored in the smallest currency unit (cents for USD). M-Pesa amounts are stored in whole Kenya Shillings. Never use floating point for money.

**Webhook idempotency** — every Stripe webhook is stored in `webhook_events` with the Stripe event ID as a unique key. Duplicate deliveries are detected and skipped before processing.

**Timestamps always with timezone** — all timestamps use `TIMESTAMPTZ` (UTC internally). Never use plain `TIMESTAMP`.

**Soft state** — subscription and payment statuses are always updated via webhook events from Stripe, never set optimistically from user actions. The database is a mirror of Stripe's source of truth.

---

## API Reference

All endpoints return:
```json
{ "success": true, "data": { ... } }
```
or on error:
```json
{ "success": false, "error": "message" }
```

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | JWT | Get current user |

**Register / Login request:**
```json
{ "email": "user@example.com", "name": "User Name", "password": "password123" }
```

**Response:**
```json
{
  "user": { "id": "uuid", "email": "...", "name": "...", "is_admin": false },
  "token": "eyJ..."
}
```

---

### Stripe Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments` | JWT | Create PaymentIntent, returns clientSecret |
| GET | `/payments` | JWT | List user's payments |
| GET | `/payments/:id` | JWT | Get payment + transactions |
| POST | `/payments/:id/refund` | JWT | Full or partial refund |

**Create payment:**
```json
{ "amount": 2000, "currency": "usd" }
```

**Refund:**
```json
{ "amount": 1000, "reason": "requested_by_customer" }
```
Omit `amount` for full refund.

---

### M-Pesa Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments/mpesa` | JWT | Initiate STK push |
| GET | `/payments/mpesa` | JWT | List user's M-Pesa payments |
| GET | `/payments/mpesa/:id` | JWT | Get single M-Pesa payment |
| POST | `/payments/mpesa/callback` | — | Safaricom callback (no auth) |

**Initiate STK push:**
```json
{
  "phone": "0712345678",
  "amount": 100,
  "account_reference": "ORDER001",
  "description": "Payment"
}
```

Phone number accepts formats: `0712345678`, `+254712345678`, `254712345678`.

---

### Subscriptions

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/subscriptions/plans` | — | List available plans |
| POST | `/subscriptions` | JWT | Create subscription |
| GET | `/subscriptions` | JWT | List user's subscriptions |
| GET | `/subscriptions/:id` | JWT | Get subscription detail |
| POST | `/subscriptions/:id/cancel` | JWT | Cancel subscription |
| POST | `/subscriptions/:id/change-plan` | JWT | Upgrade or downgrade |

**Create subscription:**
```json
{ "plan_id": "uuid", "payment_method_id": "pm_..." }
```

**Cancel:**
```json
{ "immediately": false }
```
`immediately: false` cancels at period end (user keeps access). `immediately: true` revokes access now.

**Change plan:**
```json
{ "plan_id": "new-plan-uuid" }
```
Proration is calculated automatically by Stripe.

---

### Webhooks

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/webhooks/stripe` | Stripe sig | Receives Stripe events |

Handled events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

### Admin

All admin routes require JWT + `is_admin = true`.

| Method | Path | Description |
|---|---|---|
| GET | `/admin/stats` | Revenue, user count, subscription totals |
| GET | `/admin/payments` | All payments (paginated, searchable) |
| GET | `/admin/users` | All users with totals |
| GET | `/admin/users/:id` | User detail with full history |
| POST | `/admin/payments/:id/refund` | Issue refund on behalf of user |
| POST | `/admin/subscriptions/:id/cancel` | Cancel any subscription |
| POST | `/admin/users/:id/suspend` | Suspend a user account |
| POST | `/admin/users/:id/unsuspend` | Restore a suspended account |

**Query params for paginated endpoints:**
```
?page=1&limit=20&search=email@example.com&status=succeeded&method=card
```

---

## Frontend

The frontend is a single-page React app with two entry points:

- `/` — User dashboard (requires login)
- `/admin` — Admin dashboard (requires login + `is_admin = true`)

On login, the app automatically redirects:
- Admin users → `/admin`
- Regular users → `/`

### User Dashboard tabs

**Card** — Stripe Elements payment form. Enter amount and card details, pay. On success, navigates to History.

**M-Pesa** — STK push form. Enter phone and amount, submit. The waiting screen polls every 3 seconds until the payment reaches a terminal status (succeeded/failed/cancelled) or 2 minutes elapse.

**History** — Unified list of all Stripe and M-Pesa payments, sorted by date. Click any row to see detail. Stripe payments show transactions and a refund button. M-Pesa payments show the receipt number.

**Subscription** — Shows pricing page if no active subscription, or the subscription management card if subscribed. From the card, users can change plan or cancel.

### Test cards (Stripe test mode)

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0025 0000 3155` | 3D Secure required |

Use any future expiry date and any 3-digit CVC.

---

## Admin Dashboard

Access at `/admin` after logging in with an admin account.

### Making a user admin

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

### Features

**Overview tab** — four stat cards (total revenue, active subscribers, total users, failed payments) plus subscription plan distribution and a quick summary.

**Payments tab** — every payment across all users. Search by email, filter by method (Card/M-Pesa). Paginated at 20 per page.

**Users tab** — every user with their payment count, total spent (separate Stripe and M-Pesa totals), and subscription status. Click **View →** to open the user detail modal.

**User detail modal** — full history of a user's payments and subscriptions, plus three admin actions:

- **Refund** — issue a full refund on any succeeded card payment. Available per-payment inside the card payments list.
- **Cancel subscription** — cancel any active subscription at period end. The user keeps access until the billing period expires.
- **Suspend/Unsuspend** — suspend blocks the user from logging in with a clear message. Requires a written reason. Fully reversible.

---

## Webhooks

### Local development

Use the Stripe CLI to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

Copy the `whsec_...` signing secret printed by the CLI into your `.env` as `STRIPE_WEBHOOK_SECRET`. Restart the server.

Trigger test events:

```bash
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

### Production

Create a webhook endpoint in the Stripe Dashboard:

1. Go to **Developers → Webhooks → Add endpoint**
2. URL: `https://your-backend.onrender.com/webhooks/stripe`
3. Select all 8 handled event types
4. Copy the signing secret → add to Render environment variables as `STRIPE_WEBHOOK_SECRET`

### Idempotency

Every received event is stored in `webhook_events` with the Stripe event ID as a unique key. If Stripe delivers the same event twice (which it can), the second delivery is detected and skipped silently — no duplicate processing.

To manually resend an event for testing:

```bash
stripe events resend evt_xxxxxxxxxxxxx
```

---

## M-Pesa Integration

### Sandbox setup

1. Create an account at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app and enable **Lipa Na M-Pesa Sandbox**
3. Copy Consumer Key and Consumer Secret to `.env`
4. Use shortcode `174379` and the sandbox passkey

### Testing locally

M-Pesa callbacks require a public URL. Use ngrok for local testing:

```bash
ngrok http 3000
# Copy the https URL → set as MPESA_CALLBACK_URL in .env
# Restart the server
```

In the Safaricom sandbox, callbacks are unreliable. Simulate them manually in Postman:

```
POST http://localhost:3000/payments/mpesa/callback
Content-Type: application/json

{
  "Body": {
    "stkCallback": {
      "CheckoutRequestID": "ws_CO_...",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 100 },
          { "Name": "MpesaReceiptNumber", "Value": "PGH57WLKL2" },
          { "Name": "TransactionDate", "Value": 20240617143022 },
          { "Name": "PhoneNumber", "Value": 254712345678 }
        ]
      }
    }
  }
}
```

### M-Pesa result codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | Insufficient funds |
| `1032` | Cancelled by user |
| `1037` | Timeout |
| `2001` | Wrong PIN |

### Going to production

1. Apply for a Go-Live at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Get a real business shortcode from Safaricom
3. Update `.env`: `MPESA_ENVIRONMENT=production` and your production shortcode/passkey
4. Your deployed backend URL is the callback URL — no ngrok needed in production

---

## Subscriptions

### Setting up plans

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Product catalog**
2. Create products with recurring monthly pricing
3. Copy the `price_...` IDs to `.env` as `STRIPE_BASIC_PRICE_ID` and `STRIPE_PRO_PRICE_ID`
4. On server start, `seedPlans()` fetches these from Stripe and inserts them into the `plans` table automatically

### Subscription lifecycle

```
User subscribes
     ↓
customer.subscription.created webhook → DB status: active
     ↓
Monthly renewal → invoice.paid webhook → DB status: active
     ↓
Payment fails → invoice.payment_failed → DB status: past_due
     ↓
Stripe retries (Smart Retries)
     ↓
Retry succeeds → invoice.paid → DB status: active
Retries exhausted → customer.subscription.updated → DB status: unpaid
     ↓
User cancels → customer.subscription.deleted → DB status: canceled
```

The database subscription status is always driven by webhooks — never set directly from user actions. This ensures your local state stays in sync with Stripe even if users update payment methods, banks decline charges, or Stripe retries billing.

---

## Deployment

### Backend — Render

1. Connect your GitHub repo at [render.com](https://render.com)
2. Create a **Web Service** with:
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
3. Add all environment variables from the list above
4. Enable **Auto-Deploy** in Settings → Build & Deploy

### Database — Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string to Render as `DATABASE_URL`
3. Run migrations against Neon:
   ```bash
   export DATABASE_URL="postgresql://..."
   npm run migrate
   ```

### Frontend — Vercel

1. Import your repo at [vercel.com](https://vercel.com)
2. Set root directory to `client`
3. Add environment variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
4. Deploy — Vercel auto-deploys on every push

### Keep Render awake (free tier)

Render's free tier spins down after 15 minutes of inactivity. Use [UptimeRobot](https://uptimerobot.com) (free) to ping your health endpoint every 10 minutes:

```
Monitor URL: https://your-backend.onrender.com/health
Interval: 10 minutes
```

---

## Security

### What's protected

- **JWT verification** on all user routes — tokens are signed with `JWT_SECRET` and verified on every request
- **Admin middleware** — checks `is_admin` in the database on every admin API call, independent of the frontend redirect
- **Stripe webhook signature** — every webhook is verified using `STRIPE_WEBHOOK_SECRET` before processing
- **Parameterized queries** — all SQL uses `$1, $2` placeholders via `pg`, preventing SQL injection entirely
- **Password hashing** — bcrypt with 12 salt rounds; passwords are never stored or logged
- **Rate limiting** — 100 requests per 15 minutes per IP via `express-rate-limit`
- **Helmet** — security HTTP headers set automatically on every response
- **CORS** — only your frontend origin is allowed

### What to never commit

- `.env` files — add to `.gitignore`
- Stripe secret keys (`sk_...`) — use test keys locally, live keys only in production environment variables
- JWT secret — generate a cryptographically random 64-byte hex string
- M-Pesa Consumer Secret — treat like a password

### Admin security model

The frontend redirect (admin → `/admin`, user → `/`) is UX only. Real security is enforced server-side: `requireAdmin` middleware queries the database on every admin request and returns `403` if `is_admin` is not `true`. An attacker who bypasses the frontend and calls admin endpoints directly will still get `403`.

---

## License

MIT — use freely for personal and commercial projects.

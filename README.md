# CareTip Limited — The Digital Gratitude Ecosystem

**Tagline:** *One Scan. Instant Tip.*

CareTip Limited is a **PERN-stack** platform (PostgreSQL, Express, React, Node.js) that closes the loop between in-person hospitality and digital appreciation: **branded QR journeys**, **card-based tips**, and **real-time visibility** for teams and operators.

---

## Vision

A high-end product experience built to bridge **physical service** and **digital gratitude** using URL-based QR routing, Stripe-powered payments, and PostgreSQL-backed reporting so businesses stay audit-ready while staff feel recognized the moment a tip lands.

---

## Core features (“Soft Life” suite)

### Smart QR routing (URL slugs)

- **Individual staff:** Each team member has a unique **slug** in PostgreSQL (e.g. `jane-doe`). Scanning opens the public page **`/staff/[slug]`** guests see that employee’s photo, role, bio, and monthly goal before tipping.
- **Business-level flows:** Venue QR entry points (e.g. business or pool flows) route guests through **select-team → amount → payment** so one code can represent a floor, shift, or brand while still supporting per-person slugs where needed.

Together, slugs keep links **shareable, printable, and analytics-friendly** without exposing internal IDs.

### Real-time payouts & notifications

- **Socket.io** pairs with the REST API: authenticated clients subscribe to live events (e.g. **`new_tip`**) so **employees see tips as they succeed**, without polling.
- Designed for **instant feedback** on earnings and monthly-goal progress; connection recovery and JWT-based auth align with mobile dashboards.

### Business intelligence & exports

- **PostgreSQL** is the system of record for businesses, employees, tips, and payment references.
- Businesses can **export tip transactions to CSV** (JSON → CSV via `json2csv`) for **payroll, reconciliation, and accounting**—filter-friendly columns include amounts, timestamps, and Stripe payment intent identifiers where applicable.

### Identity & trust

- **Profile photos** are encouraged (and gated in-product where required) so guests always tip a **real face**; uploads are handled via **Cloudinary** when configured.
- **“Verified Staff”** is part of the CareTip identity layer: public staff pages and in-app cues reinforce **trust**—complete profiles and consistent branding signal that the recipient is the right person.

---

## Technical architecture

| Layer | Stack |
|--------|--------|
| **Frontend** | **React 18**, **Vite**, **Tailwind CSS** (Palette 84–aligned tokens), **Lucide** icons, **React Router**, **Socket.io client** |
| **Backend** | **Node.js**, **Express**, **Socket.io**, JWT auth, **Prisma** |
| **Database** | **PostgreSQL** with **Prisma ORM** (schema + migrations in `backend/prisma`) |
| **Payments** | **Stripe** (Payment Intents, webhooks); business records support **Stripe Connect–style** account linkage (`stripeAccountId`) for routed/settled payouts—configure keys per environment |
| **Media** | **Cloudinary** (optional) for avatar uploads |

> **Note:** The codebase uses **Prisma**, not Sequelize. If you extend the stack, keep migrations and `prisma generate` in your workflow.

---

## Branding & UI standards

| Role | Hex | Usage |
|------|-----|--------|
| **Stormy Teal** | `#197278` | Primary actions, QR framing, key CTAs |
| **Dark Slate Grey** | `#283D3B` | Body text, QR dark modules |
| **Tomato Jam** | `#C44536` | Accent / urgency (sparingly) |

Design direction: **ultra-modern minimalist**—generous whitespace, clear hierarchy, and motion used for feedback (e.g. live tips), not decoration.

---

## Repository layout

```
├── src/                 # React (Vite) application
├── backend/             # Express API, Prisma, Socket.io, Stripe
│   ├── prisma/          # schema, migrations, seed
│   └── src/
└── README.md
```

---

## Setup & environment

### Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **PostgreSQL** (local or hosted, e.g. Supabase)
- **Stripe** test keys for payments
- (Optional) **Cloudinary** for production-grade image uploads

### 1. Install dependencies

From the **repository root** (frontend):

```bash
npm install
```

From **`backend/`**:

```bash
cd backend
npm install
```

### 2. Environment variables

**Backend** — copy and edit `backend/.env.example` → `backend/.env`. The API loads the **repo root `.env` first**, then **`backend/.env`** (backend wins if the same key appears in both), so you can keep `JWT_SECRET` in either file.

Run `cd backend && npm run env:check` to confirm `JWT_SECRET` and `DATABASE_URL` are seen (prints `set` / `MISSING` only).

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing secret for auth tokens |
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `PORT` | API port (default **3001**) |
| `CLOUDINARY_*` | Optional: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |

**Frontend** — create a `.env` or `.env.local` in the **project root** (Vite):

| Variable | Example | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | *(omit)* or `http://localhost:3001` | If **unset**, Vite proxies `/api` and `/socket.io` to **`http://localhost:3001`** (must match `PORT` in `backend/.env`). If set, the browser calls that origin directly (CORS is open in dev). **LAN / phone testing:** do not use `http://localhost:3001` while opening the app via `http://192.168.x.x:5173`—the browser would call *that device’s* localhost. Either omit `VITE_API_URL` (proxy) or set it to `http://<your-PC-LAN-IP>:3001` with the API listening on `0.0.0.0`. |
| `VITE_APP_URL` | `http://localhost:5173` or `https://caretip.app` | Public site origin for QR links and share URLs |

### 3. Database

```bash
cd backend
npx prisma generate
npx prisma db push
# or: npm run db:migrate
```

Always run **`npx prisma generate`** (or `npm run db:generate`) after editing `schema.prisma` or `.env` connection strings. Use **`npm run db:prisma:reset-client`** to delete `node_modules/.prisma` and regenerate the client if you see odd Prisma errors.

Optional seed:

```bash
npm run db:seed
```

### 4. Run development servers

**Terminal A — API (Express + Socket.io):**

```bash
cd backend
npm run dev
```

**Terminal B — Vite dev server:**

```bash
# from repository root
npm run dev
```

- API: `http://localhost:3001` (or your `PORT`)
- App: Vite default (e.g. `http://localhost:5173`)

If you set **`VITE_API_URL`**, it must match the API origin (default **`http://localhost:3001`**). If you leave it unset, use the same API port so the Vite proxy can reach the backend.

### 5. Production builds

```bash
# Frontend
npm run build

# Backend
cd backend && npm run build && npm start
```

---

## Admin system & security

Caretip separates **everyday accounts** (business managers and staff) from **platform operators** who can see global payment data and verification queues. This section explains how that boundary is enforced and how to create an admin safely in development.

### Why public admin signup is disabled

There is **no** `POST /api/auth/register` path that creates a `SUPER_ADMIN`. Letting anyone self-register as a platform admin would be a critical security flaw. The registration handler **rejects** payloads that try to set `role` to `SUPER_ADMIN`, `SUPER_ADMIN`-like spellings, `isPlatformAdmin: true`, or `isActive: false`. Roles for normal signups are assigned **only** by server logic (`MANAGER` for a new business, `EMPLOYEE` when joining with a valid invite).

### Role structure (API vs database)

| What users see in the app | Stored in PostgreSQL (`User.role`) |
|---------------------------|-------------------------------------|
| Business / venue owner    | `MANAGER`                           |
| Staff                     | `EMPLOYEE`                          |
| Platform operator         | `SUPER_ADMIN`                       |

The `User` row also has `is_platform_admin` (boolean). For platform routes, the API requires **both** `SUPER_ADMIN` and `isPlatformAdmin`, plus an **`is_active`** flag so access can be revoked without deleting the user.

### How `SUPER_ADMIN` is created

Use the **seed script**, not the public API:

```bash
cd backend
# Set ADMIN_SEED_SECRET in backend/.env (≥ 8 characters), then:
npm run admin:create -- you@example.com 'strong-unique-password'
```

From the repo root, `node scripts/createAdmin.js` runs the same script with `cwd` set to `backend` so Prisma and `.env` resolve correctly.

The script **hashes** the password with bcrypt, sets `isPlatformAdmin` and `isActive` to true, and by default **allows only one** `SUPER_ADMIN` unless you set `ALLOW_MULTIPLE_SUPER_ADMINS=true`. In **`NODE_ENV=production`**, the script **refuses to run** unless you set `ALLOW_ADMIN_SEED_IN_PRODUCTION=true` (use only when you deliberately bootstrap an operator on a server).

### How middleware verifies admin access (JWT + database)

JWTs prove *who signed the token*, not *who the user is right now*. For `/api/platform/*`, the stack:

1. **`authMiddleware`** — verifies the JWT and attaches `req.user`.
2. **`requirePlatformAdmin`** — loads the user from PostgreSQL with `prisma.user.findUnique` and allows the request only if the user **exists**, `role === SUPER_ADMIN`, `isPlatformAdmin === true`, and **`isActive === true`**. If any check fails, the response is **403**. Revoking platform access in the database takes effect on the **next** request, without waiting for token expiry.
3. **`auditPlatformAccess`** — appends an audit row (method + path) for compliance review.

Login also refuses disabled accounts: after a valid password, if `isActive` is false, sign-in returns **403** with a clear message.

### Security measures at a glance

| Measure | Purpose |
|--------|---------|
| **`isActive`** | Disable sign-in and platform APIs without deleting the row |
| **`requirePlatformAdmin` + DB read** | Do not trust JWT claims alone for sensitive routes |
| **`audit_logs` table** | Append-only trail of platform API access (and other audited actions) |
| **Rate limiting on `POST /login` and `POST /signin`** | Reduce brute-force attempts (configurable via `AUTH_LOGIN_MAX_PER_WINDOW`) |

### Safe admin creation in development

1. Run migrations or `db:push` so `User.is_active` and `audit_logs` exist.
2. Add `ADMIN_SEED_SECRET` to `backend/.env` (treat it like a password; do not commit real values).
3. Run `npm run admin:create -- <email> <password>` from `backend/`.
4. Sign in through the **Platform Admin** UI using `intendedRole: 'SUPER_ADMIN'` (the frontend already sends this for that flow).

### Production warnings

- **Never** expose `ADMIN_SEED_SECRET` or run admin creation from a public CI log.
- Prefer creating the first production operator **once** from a controlled environment, then rely on DB updates for additional operators if needed (with `ALLOW_MULTIPLE_SUPER_ADMINS` only when your policy allows multiple `SUPER_ADMIN` users).
- Keep `JWT_SECRET` long and unique per environment.

---

## Compliance & privacy (GDPR / CCPA–aligned patterns)

| Capability | Implementation concept |
|------------|-------------------------|
| **Data portability** | Authenticated users can **export** their data (e.g. employee JSON export endpoint) for machine-readable backup |
| **Right to erasure** | **Delete account** flows remove or anonymize user-linked records per product rules |
| **Secure authentication** | Password policy enforces **minimum 8 characters** with **uppercase, lowercase, number, and special character** requirements (`passwordValidation` on the client; enforce same rules server-side in production) |

*This section describes product-oriented controls; legal review is required for jurisdiction-specific compliance.*

---

## License & contact

Proprietary — **CareTip Limited**. For partnerships or support, use the contact channels configured in your deployment (e.g. `legal@caretip.com` / `privacy@caretip.com` as applicable).

---

*Built with care for hospitality teams everywhere.*

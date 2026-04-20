# Caretip Backend

Node.js + Express + PostgreSQL + Prisma + Stripe.

## Setup

1. Copy `.env.example` to `.env` in **`backend/`** (and/or repo root `.env`; `loadEnv` merges both). Put `DATABASE_URL` on one line — no spaces around `=`, no placeholders like `[YOUR-PASSWORD]`.
   - `DATABASE_URL` — Supabase **pooler** URL only (`*.pooler.supabase.com`). Do **not** use the direct `db.*.supabase.co` URI in `.env` on Windows (Prisma P1001). See `backend/.env.example`.
   - `JWT_SECRET` — long random string
   - `ADMIN_SEED_SECRET` — at least 8 characters (required for `npm run admin:create`)

   **`P1012` / `Environment variable not found: DATABASE_URL`:** Prisma only auto-loads `backend/.env`. If `DATABASE_URL` lives in the **repo root** `.env` only, either copy that line into `backend/.env`, or run Prisma through npm so both files load: `npm run prisma -- <prisma-args>` (e.g. `npm run prisma -- migrate status`). The `db:*` scripts already do this.

   **Duplicate `DATABASE_URL`:** `loadEnv` merges **repo root `.env`** then **`backend/.env`**, and **backend wins** on duplicate keys. If the API and Supabase Table Editor disagree (user “exists” in the UI but login can’t find them), align both files to the **same** Supabase pooler URL or remove the duplicate line from `backend/.env`.
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - From Stripe CLI or Dashboard

   **Env load order:** `src/index.ts` runs `import "dotenv/config"` then `./loadEnv.js` before any Prisma import. Scripts (`createAdmin`, `seed`, etc.) use the same pattern.

   **Windows IPv4:** ` $env:NODE_OPTIONS="--dns-result-order=ipv4first"; npm run dev `

   **Stale Prisma client:** `npm run db:prisma:reset-client` (deletes `node_modules/.prisma` and runs `db:generate`). Run **`npx prisma generate`** whenever `.env` or `schema.prisma` changes.

2. Install and generate Prisma client:
   ```bash
   cd backend && npm install && npm run db:generate
   ```
   **Schema sync (pick one):**
   - **Migrations (recommended for production):** `npm run db:migrate` (or `prisma migrate deploy` in CI). The repo ships a **single baseline migration** that creates the full schema from `schema.prisma`, so `migrate dev` can validate against a shadow DB without the old “`businesses` does not exist” error.
   - **Push (quick dev against Supabase):** `npm run db:push` — no migration history; fine when you are not using `migrate deploy` yet.

   If `db:push` refuses to add required `slug` because existing rows would violate NOT NULL: keep `slug` as `String?` in `schema.prisma`, run **`db:push`**, then **`npm run db:backfill-business-slugs`**, then set `slug` back to required `String` and **`db:push`** again. (Stop `npm run dev` first on Windows so Prisma can replace the query engine.)

   **If your database already has tables** (e.g. from an older `db:push`) and `migrate deploy` fails with “relation already exists”, either keep using **`db:push`** for that environment, or baseline the DB with [Prisma’s baselining guide](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baselining) so migration history matches reality.

   **Legacy `Role` enum (`business` / `employee` / `platform_admin`):** If `db push` ever warned that Prisma would remove those enum variants, your database drifted from `schema.prisma` (which uses `EMPLOYEE`, `MANAGER`, `SUPER_ADMIN`). **Fix once:** `npm run db:migrate:deploy` applies migration `20260328150000_align_role_enum_to_prisma`, which rewrites labels and data safely. Then verify: `npm run db:check-role`. Do **not** use `db push --accept-data-loss` to “fix” enums unless you intend to drop data.

   **Drift / “We need to reset” (`migrate dev`):** `npm run db:migrate` runs `prisma migrate dev`, which compares your **migration history** (`_prisma_migrations`) to the live DB and may ask to **reset** (drops all data). If you used **`db push`** before, history and reality often disagree.

   - **Hosted DB with data you want to keep:** do **not** reset. Instead:
     1. For each migration whose SQL is **already** reflected in the database, mark it applied (order matters):
        ```bash
        npx dotenv -e ../.env -e .env -- prisma migrate resolve --applied 20260327150000_baseline
        npx dotenv -e ../.env -e .env -- prisma migrate resolve --applied 20260328130000_user_is_active_audit_logs
        npx dotenv -e ../.env -e .env -- prisma migrate resolve --applied 20260328140000_role_enum_add_super_admin
        ```
        Only use `--applied` when the DB already matches that migration (e.g. you pushed the same schema or ran the SQL manually). If you are unsure, compare [Prisma baselining](https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/baselining).
     2. Apply anything still pending without the dev reset flow:
        ```bash
        npm run db:migrate:deploy
        ```
   - **Empty dev database:** you can use `prisma migrate reset` (destructive) or run `npm run db:migrate:deploy` on a fresh DB so migrations apply in order.
   - **Production / CI:** use **`npm run db:migrate:deploy`** only (no shadow DB, no interactive reset).

3. **Super Admin (not public signup):** `POST /api/auth/register` rejects `role: SUPER_ADMIN`, `isPlatformAdmin: true`, and `isActive: false`. Set `ADMIN_SEED_SECRET` (≥ 8 characters) in `.env`, then create the first operator:
   ```bash
   cd backend && npm run admin:create -- you@example.com 'secure-password'
   ```
   Or from the repo root: `node scripts/createAdmin.js you@example.com 'secure-password'` (wrapper sets `cwd` to `backend`).

   The script uses **bcrypt**, requires **`ADMIN_SEED_SECRET`**, blocks **production** unless `ALLOW_ADMIN_SEED_IN_PRODUCTION=true`, and by default allows only **one** `SUPER_ADMIN`. For a **second or later** admin, run **`npm run admin:create:extra -- email@example.com 'password'`** (sets `ALLOW_MULTIPLE_SUPER_ADMINS` for that run). Or set `ALLOW_MULTIPLE_SUPER_ADMINS=true` yourself and use `npm run admin:create`. See the root **README → Admin system & security** for full detail.

   **“Invalid email or password” for an admin that exists in Supabase:** (1) Sign in only at **`/platform-admin/login`**, not `/login`. (2) Run **`npm run admin:verify -- your@email.com "your-password"`** — confirms the API sees the same DB and tests bcrypt. (3) Reset the hash: **`npm run admin:create -- your@email.com 'new-password'`** (same command updates an existing row).

4. **Platform routes:** `requirePlatformAdmin` reloads the user from PostgreSQL (JWT + `SUPER_ADMIN` + `isPlatformAdmin` + `isActive`). **`audit_logs`** records platform API access. **`POST /login`** and **`POST /signin`** use rate limiting (`AUTH_LOGIN_MAX_PER_WINDOW`, default 30 per 15 minutes per IP).

5. Run dev server:
   ```bash
   npm run dev
   ```

### Development: clean DB + Prisma client + admin (destructive)

Use only when you can **drop all data** (e.g. empty Supabase dev project).

1. Stop anything locking Prisma’s query engine on Windows (API dev server, other terminals):  
   `Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force`
2. From `backend/`, reinstall if needed: `Remove-Item -Recurse -Force node_modules` then `npm install`
3. `npm run env:check` — confirm `DATABASE_URL`, `JWT_SECRET`, and `ADMIN_SEED_SECRET`
4. **Reset DB** (applies migrations + seed from `prisma.config.ts`):  
   `npm run db:migrate:reset`  
   Or one shot: `npm run db:setup:dev` (reset + `db:generate` + business slug backfill)
5. If `prisma generate` hits **EPERM** on `.dll`, close VS Code/Cursor, stop Node, retry.
6. **Create SUPER_ADMIN:**  
   `npm run admin:create -- your@email.com "YourPassword123"`
7. `npm run dev` — sign in via the platform admin UI with `intendedRole: SUPER_ADMIN`.

**Production / staging:** use `npm run db:migrate:deploy` only — never `migrate reset` or `--force`.

### Prisma config

`prisma.config.ts` defines the schema path, migrations folder, and seed command (replacing `package.json#prisma` for Prisma 7 compatibility).

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | - | Register (business or employee) |
| POST | /api/auth/login | - | Login (same as `/signin`) |
| POST | /api/auth/signin | - | Sign-in (same handler as `/login`) |
| POST | /api/business/generate-invite | JWT (business) | Generate 6-digit invite code |
| GET | /api/business/:id | - | Get business by ID (for QR landing) |
| GET | /api/business/stats/:id | JWT | Dashboard stats |
| GET | /api/employees?businessId= | JWT | List employees |
| POST | /api/tips/create-intent | - | Create Stripe PaymentIntent |
| POST | /api/webhook/stripe | Stripe signature | Webhook for payment success |

## Stripe Webhook

For local dev, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

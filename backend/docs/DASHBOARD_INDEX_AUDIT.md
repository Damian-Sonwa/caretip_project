# Dashboard index audit

Audit date: 2026-05-26. Based on ORM query inspection of dashboard/analytics paths and PostgreSQL index design for `tips`, `employees`, `notifications`, `refresh_tokens`, and `employee_goals`.

## How to run EXPLAIN ANALYZE locally

Apply migration `20260526120000_dashboard_query_indexes`, then run:

```bash
cd backend
psql "$DATABASE_URL" -f scripts/dashboard-index-explain.sql
```

Replace `:employee_id` and `:business_id` with real UUIDs from your seed data.

## Findings summary

| Area | Query pattern | Before | Risk |
|------|---------------|--------|------|
| Employee period stats | `tips` WHERE `employee_id`, `status=success`, `created_at` range + ORDER BY `created_at` DESC | Only `business_id` indexes on `tips` | **Seq scan** on employee dashboards |
| Employee account hero | Aggregates on `employee_id` + `status` (+ `payout_status` for paid) | No `employee_id` index | Slow hero loads |
| Business stats | `aggregate` / `groupBy` on `business_id`, `status`, `created_at` range | `(business_id, status)` without `created_at` | Large index scans for month/week charts |
| Business chart rows | ~~`findMany` all tips in period~~ → SQL `GROUP BY` day/month (`tipChartBuckets.ts`) | Same indexes | Heap fetch eliminated when indexes applied |
| Auth refresh | `updateMany` WHERE `user_id` AND `revoked_at IS NULL` | Index on `user_id` only | Filter on `revoked_at` not indexed |
| Notifications unread | `count` WHERE `user_id` AND `read_at IS NULL` | `(user_id, read_at)` | Suboptimal for NULL-only counts |
| Notification inbox | `findMany` WHERE `user_id` ORDER BY `created_at` DESC | `(user_id, created_at DESC)` | **OK** |
| Employee roster | `findMany` WHERE `business_id` ORDER BY `is_active`, `name` | `(business_id, location_id)` only | Sort step on large teams |
| Business goals | `employee_goals` via `employee.business_id` | `(employee_id)`, `(employee_id, status)` | Missing sort on `updated_at` |
| Refresh lookup | `findUnique` on `token_hash` | Unique on `token_hash` | **OK** |

## Indexes added (migration `20260526120000_dashboard_query_indexes`)

### `tips` (table `tips`)

1. **`tips_employee_id_status_created_at_idx`**  
   `(employee_id, status, created_at DESC)`  
   Serves: `loadEmployeePeriodSummary`, `loadEmployeePeriodAnalytics`, `sumTips` (goals), month totals.

2. **`tips_business_id_status_created_at_idx`**  
   `(business_id, status, created_at DESC)`  
   Serves: business `tipWhere` aggregates, `groupBy` by employee, chart `findMany`.

3. **`tips_employee_id_status_payout_status_idx`**  
   `(employee_id, status, payout_status)`  
   Serves: `loadEmployeeAccountSummary` paid aggregate.

4. **Dropped `tips_business_id_status_idx`**  
   Redundant with (2) for dashboard queries; `(business_id)` retained for exports.

### `refresh_tokens`

- **`refresh_tokens_user_id_revoked_at_idx`** — `(user_id, revoked_at)` for `revokeAllRefreshTokensForUser` and rotation cleanup.

### `notifications`

- **`notifications_user_id_unread_idx`** (partial) — `(user_id) WHERE read_at IS NULL` for unread badge counts.

Existing `(user_id, created_at DESC)` kept for inbox listing.

### `employees`

- **`employees_business_id_active_name_idx`** — `(business_id, is_active DESC, name ASC)` for business dashboard roster.
- **`employees_business_id_active_activation_active_idx`** (partial, migration `20260527133000`) — `(business_id) WHERE is_active = true AND activation_status = 'active'` to speed the “tipping-ready” count predicate (email verification checked via `User`).
- **`employees_business_id_missing_qr_idx`** (partial, migration `20260527134500`) — `(business_id) WHERE slug IS NULL OR slug = ''` to speed “missing QR” roster pulse.

### `employee_goals`

- **`employee_goals_employee_status_updated_idx`** — `(employee_id, status, updated_at DESC)`; replaces redundant `(employee_id, status)` in schema.

- **`employee_goals_active_updated_idx`** (partial, migration `20260527110000`) — `(status, updated_at DESC) WHERE status = 'active'` for business dashboard goal list sort.

## Intentionally not added

- **Covering indexes including `amount`** — would speed aggregates slightly but increase write amplification on every tip; partial btree indexes above are enough for typical venue sizes.
- **Duplicate `(employee_id, status)` on tips** — partial indexes cover all production queries with `status = success`.
- **GIN on notification metadata** — not used in dashboard paths.

## API latency profiling (local)

With the backend running, open a dashboard and watch the server console for lines like:

```
[dashboard.timing] employee.tips.summary 120ms { employeeId, timeframe, scope }
[dashboard.timing] employee.tips.analytics 890ms ...
[dashboard.timing] business.stats.analytics 2100ms ...
```

Set `DASHBOARD_TIMING=1` in production-like environments to force timing logs.

### Root cause fixed: global Prisma serialization queue

Employee dashboard handlers previously wrapped requests in `runSerializedByKey("prisma", ...)`, forcing **account + summary + analytics** to run one-after-another on a single queue. That explained 20–40s+ client durations even when individual SQL was fast.

**Fix:** removed app-level serialization for period summary/analytics; parallelized summary scope (`summary`, `currentMonthTotal`, `goal`); parallelized hero account aggregates.

### Remaining backend hotspots

| Path | Risk | Mitigation |
|------|------|------------|
| `loadEmployeePeriodAnalytics` | `findMany` all tips in period for chart bucketing | Recent tips capped (`take: 30`); chart still scans period rows (index: `tips_employee_id_status_created_at_idx`) |
| `getBusinessStatsAnalyticsImpl` | `findMany` all tips for week/month charts + per-goal `sumTips` (up to 25) | Short-lived cache TTL; consider SQL bucket aggregation if venues are large |
| Cold DB / pool size 1 | Supabase transaction pool | Keep parallel queries modest; indexes applied |

### Targets (p95, warm cache)

| Section | Target |
|---------|--------|
| Hero account | &lt; 1s |
| Metric cards (summary scope) | &lt; 2s |
| Charts + goals (analytics scope) | &lt; 3–5s |

## Application layer (already in place)

- Short-lived server caches for business/employee stats (`shortLivedCache`, dashboard SWR on client).
- Parallel `summary` + `analytics` scopes with deduped `loadBusinessStatsContext`.
- Serialized Prisma access where pool size is 1.

Indexes complement those patterns; they do not replace them.

## Post-deploy verification

After `npx prisma migrate deploy`, confirm plans use new indexes:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT SUM(amount), COUNT(*)
FROM tips
WHERE employee_id = $1 AND status = 'success'
  AND created_at >= $2 AND created_at <= $3;
```

Expect: `Index Scan` or `Bitmap Index Scan` on `tips_employee_id_status_created_at_idx`, not `Seq Scan on tips`.

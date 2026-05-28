# Goal ↔ Dashboard Timezone Synchronization Verification

**Date:** 2026-05-28  
**Scope:** Goal period boundaries, pacing, and tip totals aligned with dashboard analytics.  
**Out of scope (unchanged):** Dashboard orchestration, SQL bundle caching, realtime sockets, serialized DB scopes.

---

## Problem (before)

| Layer | Period source |
|-------|----------------|
| Business / employee dashboards | `businessUtcRangeForTimeframe` in `backend/src/utils/businessTime.ts` — IANA timezone from `Business.timezone` (default `Europe/Berlin`), Monday-start weeks |
| Goals (`effectivePeriodBounds`, business goal SQL, pacing) | **UTC** midnight / Monday / month boundaries |
| Business goals list SQL | Extra `AND t.created_at >= monthStart` (UTC) incorrectly clipped daily/weekly goals |

Near timezone boundaries (e.g. 22:00 UTC = midnight Berlin), goal `currentAmount` and dashboard `periodAmount` could diverge.

---

## Fix (single source of truth)

All goal calendar math now delegates to **`businessTime.ts`**:

| Goal period | Dashboard timeframe | Helper |
|-------------|---------------------|--------|
| `daily` | `today` | `goalPeriodToBusinessTimeframe` → `businessUtcRangeForTimeframe` |
| `weekly` | `week` | same (Monday-start week) |
| `monthly` | `month` | same |

New exports:

- `businessUtcRangeForGoalPeriod(period, tz, nowUtc)`
- `businessUtcStartOfGoalStartDate(startDate, tz)`
- `effectiveGoalPeriodBounds(period, startDate, tz, now)` — period start ∩ goal start date, end = `now`
- `elapsedRatioInGoalPeriod(period, tz, now)` — pacing uses full business-local period length

**Consumers updated (no dashboard loader changes):**

- `backend/src/services/goal.service.ts` — progress, pacing, `listEmployeeGoalsForBusiness` SQL
- `backend/src/services/employeeTipsDashboard.service.ts` — `resolveGoalForSummaryBundle` passes `businessTimezone` from existing employee context

Timezone resolution: `Employee` → `Business.timezone` via `sanitizeIanaTimezone` (same as dashboards).

---

## Automated proof

Run from `backend/`:

```bash
npm run verify:goal-timezone
```

Script: `backend/src/scripts/verifyGoalTimezoneSync.ts`

**Assertions:**

1. For each of `daily` / `weekly` / `monthly`, `businessUtcRangeForGoalPeriod` **`startUtc` and `endUtc` equal** `businessUtcRangeForTimeframe(mapped timeframe, Europe/Berlin)` at:
   - Midday UTC (`2026-05-28T12:00:00Z`)
   - One second before Berlin midnight (`2026-05-28T21:59:59Z` — still prior local day)
   - One second after Berlin midnight (`2026-05-28T22:00:01Z` — new local day)
   - Mid-week instant (`2026-06-02T01:00:00Z`)
2. `effectiveGoalPeriodBounds("monthly", …)` **`startUtc` equals** dashboard month `startUtc` when goal started before current month.

**Last run:** PASS (13 boundary assertions).

TypeScript: `npx tsc --noEmit` in `backend/` — PASS.

---

## Boundary behavior (Europe/Berlin example)

Luxon week: Monday = start. Local day flips at **22:00 UTC** in summer (CEST, UTC+2).

| UTC instant | Local date (Berlin) | `today` period start (UTC) |
|-------------|---------------------|----------------------------|
| `2026-05-28T21:59:59Z` | 2026-05-28 | `2026-05-27T22:00:00.000Z` |
| `2026-05-28T22:00:01Z` | 2026-05-29 | `2026-05-28T22:00:00.000Z` |

Goals with `goalPeriod: daily` now flip period at the **same** instant as the employee dashboard “Today” card and business “today” analytics.

---

## Tip counting alignment

| Path | Window |
|------|--------|
| Dashboard period total | `created_at` ∈ `[periodRange.startUtc, periodRange.endUtc]` |
| Goal progress (`effectivePeriodBounds`) | `created_at` ∈ `[max(periodStart, goalStartDate), now]` |
| Employee summary goal fast-path | FILTER on `goalBounds.start`–`goalBounds.end` inside same `periodRange` / `monthRange` scan as dashboard SQL bundle |

When the active goal period matches the selected dashboard timeframe and `goalBounds.start >= periodRange.startUtc`, the bundled FILTER sum matches dashboard period logic (subset filter on identical scan bounds).

Business goals list: removed erroneous UTC `monthStart` floor on all periods; `period_start` in SQL now uses business-local day/week/month starts.

---

## Caching note (minimal)

Goal progress cache key: `goal-progress:{userId}:{tz}` so timezone changes invalidate correctly. Dashboard cache keys already included `tz` — **unchanged**.

---

## Manual QA checklist

1. Set business timezone to `Europe/Berlin` (or non-UTC).
2. Create a **daily** goal; add a tip at **23:30 Berlin** on day D.
3. Before local midnight: employee “Today” total and goal `currentAmount` should match.
4. After local midnight: both should reset together (not at UTC midnight).
5. Business dashboard goals list: same `currentAmount` as employee goal for that employee.
6. Weekly goal spanning Monday boundary: week total matches “This week” chart aggregate.

---

## Files touched

| File | Change |
|------|--------|
| `backend/src/utils/businessTime.ts` | Goal period helpers |
| `backend/src/services/goal.service.ts` | Business TZ throughout; SQL fix |
| `backend/src/services/employeeTipsDashboard.service.ts` | Pass TZ into goal bounds / progress |
| `backend/src/scripts/verifyGoalTimezoneSync.ts` | Automated boundary proof |
| `backend/package.json` | `verify:goal-timezone` script |

**Not modified:** `business.service.ts` orchestration, `tipChartBuckets` bundle structure, frontend hooks, socket handlers, cache TTLs, serialization keys (except goal-progress key suffix).

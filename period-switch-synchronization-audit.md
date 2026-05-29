# Period-switch synchronization audit (Business / Employee / Admin)

**Date:** 2026-05-29  
**Goal:** Fix UX issues when users switch periods before analytics hydration completes.  
**Constraints:** No changes to staged loading architecture, orchestration, caching architecture, sockets, hydration strategy, or prefetch strategy. Only targeted synchronization fixes.

---

## Observed symptom (reported)

1. Dashboard initializes.
2. Metrics appear.
3. Charts/goals still loading.
4. User switches period quickly.
5. Metric cards flash **0 / 0.00** temporarily.
6. Charts/goals can remain **stuck loading**.
7. Switching again often recovers.

---

## Findings

### A) “Zero flash” is caused by destructive state clears during period change

Both business and employee hooks have code paths that intentionally clear the active payload when the new period has no cached/partial data yet:

- **Business**: `useBusinessDashboardStats` can execute:
  - `setStats(null)` / `setStatsTimeframe(null)` on a period switch when no SWR hit/partials exist.
  - This makes downstream metric components fall back to `0` while the new period loads.

- **Employee**: `useEmployeeDashboardAnalytics` can execute:
  - `setPayload(null)` / `setDataTimeframe(null)` on a period switch when no SWR hit/partials exist.
  - Same outcome: cards render zero-ish values until the new response arrives.

**Conclusion:** UX requires “preserve last known good data”; the minimal solution is to retain a “last-known-good metrics snapshot” and serve it while a new period is hydrating.

---

### B) “Charts/goals stuck loading” can occur from cancelled deferred analytics not clearing flags

In `useBusinessDashboardStats`, analytics fetch can be **deferred** (scheduled after the summary settles). In this deferred mode:

- A local `analyticsDeferred` flag suppresses `setAnalyticsLoading(false)` in `finally` (because the deferred task is expected to resolve it).
- If the user switches periods quickly, `cancelDeferredAnalytics()` clears the timer, so the deferred task never runs.
- The original call’s `finally` still sees `analyticsDeferred === true`, so it **does not** clear `analyticsLoading`, leaving charts/goals “loading” indefinitely until another interaction forces a state transition.

**Conclusion:** we need a minimal synchronization guard so cancelled deferred analytics always clears loading flags for the superseded request.

---

### C) Admin dashboard

The Platform Admin dashboard does not have the same “period toggle” pattern as business/employee. It has staged loading with background refresh and a timezone selector. The reported period-switch bug is primarily reproduced on business/employee dashboards.

---

## Minimal fixes (implemented)

### 1) Preserve last-known-good metric values during period switches

- Track the last metrics snapshot that was successfully committed to the UI.
- If the active period’s payload is temporarily unavailable (period mismatch during hydration), return the last snapshot for rendering **instead of null**.
- Keep existing “loading” indicators (period toggle dot / refreshing state) so users understand the data is being replaced.

### 2) Safe period switching: ignore/cancel stale requests without allowing them to break loading flags

- Business hook: when deferred analytics is cancelled due to period change, ensure `analyticsLoading` (and related hydration phases) cannot remain stuck for a superseded request.
- Existing abort controllers and `seq` checks remain the authority for stale response protection.

---

## Validation plan (manual)

For each dashboard: load page, immediately switch periods before charts/goals settle.

### Business Dashboard

- First load (cold): switch week → year quickly during initial chart hydration.
- Warm cache: switch repeatedly.
- Slow network simulation: confirm cards do **not** flash zero, charts/goals do not stick.

### Employee Dashboard

- Same aggressive switching on `today/week/month`.

### Admin Dashboard

- Not period-driven; confirm no regression to initial loading + background refresh indicators.

---

## Success criteria mapping

- **No zero flashes**: achieved by last-known-good metrics snapshots.
- **No stuck loading**: achieved by clearing loading flags when deferred analytics is cancelled/superseded.
- **No stale overwrite**: preserved by existing abort + `seq`/timeframe guards (unchanged).


# Timeframe Switch & Prefetch Audit

**Date:** 2026-05-29  
**Scope:** Business + Employee dashboard period toggles (not platform admin).  
**Stack note:** Dashboards do **not** use React Query / TanStack Query. Caching is custom: in-memory partial maps, session SWR (`dashboardSwrCache.ts`, 8s TTL), and API client dedupe/result cache (`api.ts`).

---

## Executive summary

| Dashboard | Prefetch after init | Session cache on switch | Why loading still appeared |
|-----------|--------------------|-------------------------|----------------------------|
| **Business** | Yes (week/year after ~900ms, sequential) | Partial maps only; SWR blocked on switch by design | `isRevalidating` set on every switch; SWR not hydrated; Year often not prefetched yet; prefetch did not `persistSwr` |
| **Employee** | **Was missing** | Partial maps; SWR blocked; **cache cleared on switch** | No prefetch; `abortInactiveTimeframes` cleared client inflight keys; always `setIsRevalidating(true)` |

**Fixes applied (conservative):** Period-switch session cache hydration, instant UI when period fully cached (skip revalidating spinner), `persistSwr` after background prefetch, employee post-render prefetch, stop clearing employee client cache on switch, prefetch delay 900ms (was 1200ms business-only).

---

## 1. Business dashboard

### Prefetch (after initial render)

| Item | Status |
|------|--------|
| Prefetch exists | **Yes** — `scheduleInactivePrefetch` in `useBusinessDashboardStats.ts` |
| When it runs | ~900ms after active timeframe pipeline settles (`DASHBOARD_INACTIVE_PREFETCH_DELAY_MS`) |
| What is prefetched | Inactive timeframes among `week`, `month`, `year` (sequential, one after another) |
| How | `loadStatsFor(tf, { affectsUi: false, silent: true })` — summary + analytics (no rAF defer when not UI) |
| Stored where | `summaryPartialRef`, `analyticsPartialRef`; **now also** `businessSwrStore` via `persistSwr` after background load |

**Classification:** Working as designed for prefetch **existence**; **Prefetch not completing** if user switches before sequential queue finishes (Year is last when default is month).

### Cache on timeframe switch

| Layer | TTL | Used on switch (before fix) |
|-------|-----|-----------------------------|
| Session SWR (`business:${tf}`) | 8s | **No** — `canUseDashboardSwrCache` requires `soft: true` (tab refocus only) |
| Partial maps (`summaryPartialRef` / `analyticsPartialRef`) | Session | **Partial** — `setAnalyticsTimeframe` only if summary metrics present |
| API result cache (`businessStatsResultCache`) | 90s | Yes if prefetch/switch triggered fetch with same key |

### Why first Year switch showed loading after init

1. **Missing prefetch completion** — Default period is `month`. Prefetch order: `week` → `year`. User switching to Year before both complete → cold fetch.
2. **Cache not reused (SWR)** — Fresh-first policy blocked SWR on period change (`dashboardHydration.ts`).
3. **Unnecessary refetches / UX** — `useEffect` on `analyticsTimeframe` always calls `loadStatsFor({ affectsUi: true })`, which set `isRevalidating: true` even when partial data existed → `isPeriodRefreshing` + chart skeleton (`analyticsTimeframeLoading`).
4. **Summary-only hit** — If prefetch finished summary but not analytics, charts stayed in loading until analytics returned.

### After fix

- `hydratePeriodSessionCache(tf)` on switch and at start of `loadStatsFor` (when `hasSettledLiveUi`).
- `isPeriodSessionReady(tf)` → instant commit, **no** `isRevalidating`, no network if summary + analytics in session.
- Background prefetch writes SWR via `persistSwr`.

---

## 2. Employee dashboard

### Prefetch (before fix)

| Item | Status |
|------|--------|
| Prefetch | **Missing prefetch** |
| Period switch | Always `useEffect` → `loadFor({ affectsUi: true })` |
| Cache on switch | Partial maps if present; **SWR not used** |

### Aggressive invalidation (before fix)

`abortInactiveTimeframes` called `clearEmployeeTipsClientCache(tf)` for every inactive period on each switch — **Unnecessary refetches** / defeated warm inflight dedupe.

Employee API has **inflight dedupe only** (no 90s result cache like business).

### Summary bundle

`scope=summary` returns `analyticsBundled: true` (metrics + charts + goal in one SQL bundle). First load for a period is one round-trip; switching to uncached period still hits network once.

### After fix

- Post-render prefetch for inactive `today` / `week` / `month` (same 900ms delay, sequential).
- Removed `clearEmployeeTipsClientCache` from switch abort path.
- Same period-switch session hydration + instant path as business.

---

## 3. React Query / cache layer

**Not applicable** — no `useQuery`, `staleTime`, `cacheTime`, `gcTime`, `refetchOnMount`, `refetchOnWindowFocus`, or `refetchOnReconnect` on these dashboards.

### Actual equivalents

| React Query concept | CareTip implementation |
|---------------------|-------------------------|
| Query key | `business:${tf}` / `employee:period:${tf}` + API keys `timeframe:scope` |
| staleTime | `DASHBOARD_SWR_METRICS_TTL_MS` = **8s** (session SWR only) |
| cacheTime / gcTime | Session-only `Map` cleared on logout/disable; API business stats **90s** |
| refetchOnMount | `useEffect` on timeframe → always `loadStatsFor` / `loadFor` |
| refetchOnWindowFocus | `useDashboardTabRefocus` → `refetchLive` with `soft: true` |
| invalidateQueries | `clearBusinessStatsClientCache`, socket `refreshStatsQuiet`, roster invalidation |

### Fresh-first policy

```ts
// dashboardHydration.ts — SWR only when soft (background)
canUseDashboardSwrCache({ hasSettledLiveUi, soft: true })

// NEW — period switch after first live paint
canUsePeriodSwitchCache(hasSettledLiveUi)
```

---

## 4. UX audit (expected behavior)

| Scenario | First switch (cold) | Second switch (warm) |
|----------|---------------------|----------------------|
| Business → Year (prefetch incomplete) | Network + chart loading | Instant if prefetch completed |
| Business → Week (after prefetch) | **Instant** (metrics + charts) | Instant |
| Employee → week (after prefetch) | **Instant** if bundled/cached | Instant |
| Employee → month (cold) | One summary bundle ~1.5–2.5s | Instant after prefetch |

### Metrics to watch (dev)

- `[dashboard-dev]` phases via `devSetHydrationPhase`
- `analyticsTimeframeLoading` only when `isRevalidating && (summaryLoading || analyticsLoading)`
- Server: `biz-dash-sql:*` / `emp-dash-sql:*` cache hits on repeat timeframe

### Cache hit rate (qualitative)

| Source | Business | Employee |
|--------|----------|----------|
| Partial map hit | High after prefetch | High after prefetch + bundled summary |
| Session SWR hit | Medium (8s TTL) | Medium (8s TTL) |
| API result cache | High (90s) business | Low (no result TTL) |

### Background prefetch completion rate

- **Business:** ~2 inactive periods × (summary + analytics) sequential after 900ms — completes in ~3–6s on typical pooler latency if user stays on default month.
- **Employee:** Same pattern; each inactive period = one `scope=summary` bundle when cold.

---

## 5. Classification matrix

| Issue | Business | Employee |
|-------|----------|----------|
| Working as designed | Staged summary → deferred analytics on first paint; serialized DB | Single summary bundle; staged metrics/charts |
| Missing prefetch | — | **Was** missing → **fixed** |
| Prefetch not completing | Year if user switches early | Same |
| Cache not reused | SWR on switch; revalidating flag | SWR + cache clear on switch |
| Unnecessary refetches | `isRevalidating` on cached switch | Always refetch + clear cache |

---

## 6. Files changed (this pass)

| File | Change |
|------|--------|
| `src/app/lib/dashboardHydration.ts` | `canUsePeriodSwitchCache` |
| `src/app/lib/dashboardTimeframeOrchestration.ts` | `DASHBOARD_INACTIVE_PREFETCH_DELAY_MS` |
| `src/app/hooks/useBusinessDashboardStats.ts` | Switch hydration, instant cached path, `persistSwr` on prefetch |
| `src/app/hooks/useEmployeeDashboardAnalytics.ts` | Prefetch, no cache clear on switch, instant cached path |

**Not changed:** Backend SQL bundle orchestration, cache TTLs, socket handlers, first-paint staging, hero defer, analytics rAF defer on **first** active load.

---

## 7. Verification checklist

1. Open Business dashboard (month default). Wait ~5s. Switch Week → Year → Month.
   - Second visit to Week/Year should show **no** period spinner on metrics/charts.
2. Open Employee dashboard (today default). Wait ~5s. Switch week → month → today.
   - Repeat switches should be near-instant.
3. DevTools: first switch may show `/api/.../stats` or `/api/tips/employee`; repeat switches within 8s should not (session cache path).
4. Hard refresh → first switch to any period may still load (by design).

---

## 8. Remaining limitations

- **8s SWR TTL** — After 8s idle, switch may refetch silently or show brief revalidate if partial maps evicted.
- **Sequential prefetch** — Protects `connection_limit=1`; Year is last when on month. Parallel prefetch would be faster but higher DB risk.
- **First switch to uncached period** — Always one network pass (working as designed).
- **Tab refocus** — Still soft-revalidates active period (`refetchLive`).

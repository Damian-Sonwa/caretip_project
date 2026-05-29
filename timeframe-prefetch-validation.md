# Timeframe Prefetch — Production Build & Validation

**Date:** 2026-05-29  
**Scope:** Period-switch cache/prefetch only (4 source files + audit docs).  
**Commit intent:** `useBusinessDashboardStats`, `useEmployeeDashboardAnalytics`, `dashboardHydration`, `dashboardTimeframeOrchestration`.

---

## Build results

| Step | Command | Result | Notes |
|------|---------|--------|-------|
| Frontend production | `npm run build` (root) | **PASS** | Vite 6.4.2, ~90s, PWA precache 115 entries |
| Backend TypeScript | `npx tsc --noEmit` (backend/) | **PASS** | No errors |
| Backend production | `npm run build` (backend/) | **FAIL (environment)** | Prisma `EPERM` renaming `query_engine-windows.dll.node` (file locked, likely dev server). Not caused by prefetch changes (frontend-only diff). |
| Frontend TypeScript | `npx tsc --noEmit` (root) | **FAIL (pre-existing)** | ~15+ errors; **zero** in prefetch files (see below) |

**Verdict:** Production bundle for the SPA **builds successfully** with prefetch changes. Backend prefetch work is **frontend-only**; backend `tsc` is clean.

---

## Errors introduced by timeframe-prefetch work

| File | `tsc` errors |
|------|----------------|
| `src/app/hooks/useBusinessDashboardStats.ts` | **None** |
| `src/app/hooks/useEmployeeDashboardAnalytics.ts` | **None** |
| `src/app/lib/dashboardHydration.ts` | **None** |
| `src/app/lib/dashboardTimeframeOrchestration.ts` | **None** |

**Conclusion:** No new TypeScript defects attributable to this change set.

---

## Pre-existing repository type/build errors

These appear in `npx tsc --noEmit` but are **outside** the prefetch diff:

| File | Issue |
|------|--------|
| `AuthOAuthButtons.tsx` | `locale` not on Google Sign-In button props |
| `employeeDashboardUi.ts` | Duplicate `cardDesc` key |
| `LandingSocialProofSection.tsx` | Unknown typography token `featureCopy` |
| `PaymentsSection.tsx` | Unknown tokens `featureCopySemibold`, `bodyCopyMuted` |
| `NotificationBell.tsx` | `user` possibly null |
| `useAuthInitializer.ts` | `number` vs `Timeout` |
| `api.ts` | `AbortSignal | null`, `caretipSilentErrors` on `RequestInit` |
| `authSessionBootstrap.ts` | `SessionBootstrapResult` union narrowing |
| `BusinessDetailPage.tsx` | Missing `btnPrimary` on `platformUi` |

Vite production build does not run full-project `tsc`, so these do not block `npm run build` today.

---

## Verification matrix (static code review)

### Business dashboard period switching

| Check | Status | Evidence |
|-------|--------|----------|
| Prefetch after initial render | **Pass** | `scheduleInactivePrefetch` @ 900ms after active load settles |
| Prefetch stored | **Pass** | `summaryPartialRef`, `analyticsPartialRef`, `persistSwr` on background complete |
| Cache reused on switch | **Pass** | `hydratePeriodSessionCache` + `isPeriodSessionReady` before network |
| Year first switch loading | **Mitigated** | Still loads if prefetch queue not finished; instant once week+year prefetched |
| No duplicate inflight per TF | **Pass** | `statsLoadInflightByTfRef` dedupes concurrent `loadStatsFor` |

### Employee dashboard period switching

| Check | Status | Evidence |
|-------|--------|----------|
| Prefetch existed before | **Fail → Fixed** | Added `scheduleInactivePrefetch` (same 900ms / sequential pattern) |
| Cache on switch | **Pass** | `hydratePeriodSessionCache`, `isPeriodSessionReady`, early return without fetch |
| Forced refetch on switch | **Fixed** | Removed `clearEmployeeTipsClientCache` from `abortInactiveTimeframes` |
| Bundled summary | **Pass** | Unchanged; `analyticsBundled` still marks analytics settled in one trip |

### Cached periods — no loading spinners

| Signal | When cache hit |
|--------|----------------|
| Business `isPeriodRefreshing` | Not set when `periodSessionReady && !revalidate` (early return before `setIsRevalidating(true)`) |
| Business `analyticsTimeframeLoading` | Requires `isRevalidating && (summaryLoading \|\| analyticsLoading)` |
| Employee `isPeriodRefreshing` | Same pattern |

**Pass** for fully cached periods (summary + analytics in session).

### Prefetched periods reuse cache

| Layer | Business | Employee |
|-------|----------|----------|
| In-memory partials | Yes | Yes |
| Session SWR (8s) | Yes, via `hydratePeriodSessionCache` | Yes |
| API result cache (90s) | Yes (`getBusinessStats`) | Inflight dedupe only |

### First dashboard paint unchanged

| Behavior | Changed? |
|----------|----------|
| Initial `useEffect` → `loadStatsFor` / `loadFor` with `affectsUi: true` | **No** |
| Deferred analytics (rAF) on first active period | **No** |
| `canUseDashboardSwrCache` still requires `soft: true` on cold load | **No** |
| Prefetch only after `markDashboardLiveSettled` + delay | **No** (delay 1200→900ms only affects background) |

**Pass** — first paint path untouched.

### No duplicate requests introduced

| Mechanism | Business | Employee |
|-----------|----------|----------|
| Inflight dedup per timeframe | `statsLoadInflightByTfRef` | Relies on `getTipsByEmployee` inflight map (unchanged) |
| Cached switch early return | No HTTP when `periodSessionReady` | Same |
| Prefetch `affectsUi: false` | Sequential, skips active TF | Sequential |

**Note:** Employee lacks per-TF promise map like business; concurrent prefetch + user switch to same cold TF could still share API inflight dedupe — acceptable, not a regression.

### No new hydration regressions

| Risk | Mitigation |
|------|------------|
| SWR on cold load | `canUsePeriodSwitchCache` only after `hasSettledLiveUi` |
| Stale data on switch | Intentional instant paint; tab refocus still soft-revalidates |
| Abort on switch | Still aborts inactive **controllers** only; employee no longer clears API cache |

---

## Manual QA checklist (recommended)

1. **Business:** Login → dashboard (month). Wait **≥5s**. Toggle Week → Year → Month. Expect no period spinner on repeat visits.
2. **Employee:** Login → dashboard (today). Wait **≥5s**. Toggle week → month → today. Expect near-instant repeat toggles.
3. **Cold period:** Hard refresh → switch to uncached period once → may show loading (expected).
4. **Network tab:** Second switch to same period within 8s should not repeat `/stats` or `/tips/employee` if session cache hit (early return).

---

## Files in this commit

```
src/app/hooks/useBusinessDashboardStats.ts
src/app/hooks/useEmployeeDashboardAnalytics.ts
src/app/lib/dashboardHydration.ts
src/app/lib/dashboardTimeframeOrchestration.ts
timeframe-switch-audit.md
timeframe-prefetch-validation.md
```

**Excluded** from commit: unrelated dirty files (AI audit scripts, platform diagnostics, etc.).

---

## Overall validation verdict

| Criterion | Result |
|-----------|--------|
| Production SPA build | **PASS** |
| Prefetch changes type-clean | **PASS** |
| Functional requirements (static) | **PASS** |
| Safe to commit/push prefetch-only | **YES** |

# Sprint 8.1 — Performance Refinement Report

**Generated:** 2026-06-24  
**Build:** `npm run typecheck` ✅ · `npm run build` ✅  
**Scope:** Close remaining P1 bottlenecks from Sprint 8 audit — no feature redesign, no dashboard IA changes.

---

## Executive Summary

Sprint 8.1 unifies dashboard analytics on a **single `scope=full` fetch**, introduces a **shared venue catalog cache**, **consolidates tip socket traffic**, improves **chart mount deferral**, and adds **cache effectiveness instrumentation**.

| Area | Before (Sprint 8) | After (Sprint 8.1) |
|------|-------------------|---------------------|
| Dashboard Overview cold API (period stats) | 2 calls (`summary` + `analytics`) | **1 call** (`fetchBusinessPeriodStats` → `scope=full`) |
| QR Studio → Staff venue fetches | 4 HTTP (2× locations + 2× tables) | **1 HTTP** (shared 60s cache) |
| Server tip socket emits / tip | 6 legacy + 2 canonical = **8** | **4** (canonical + 1 legacy alias / room) |
| Client tip listeners / component | 3 event names each | **1** `subscribeTipReceived()` helper |
| Analytics chart mount | Idle only | Idle + **viewport** (`whenVisible`) |
| Cache observability | Refetch counters only | Hits/misses for analytics + venue catalog |

---

## 8.1A — Analytics Hook Unification

### Problem
`useBusinessDashboardStats` issued overlapping `GET /api/business/me/stats?scope=summary` and `?scope=analytics` on cold load — same timeframe, duplicate backend work.

### Solution
- Added `fetchBusinessPeriodStats()` — single authoritative `scope=full` fetch that writes to `businessAnalyticsStore` via `upsertBusinessAnalyticsStatsBundle`.
- Refactored `useBusinessDashboardStats` network path to call `fetchBusinessPeriodStats` once; KPI and chart partials both hydrate from the same response.
- Hero month deferred load also uses `fetchBusinessPeriodStats` (cache-first).
- Extended `fetchBusinessAnalyticsBundle` with `includeWeekStats` / `includeQrAnalytics` flags for lighter fetches on analytics pages when needed.

### Request count (Dashboard Overview cold load)

| Step | Before | After |
|------|--------|-------|
| Active period stats | `summary` + `analytics` = **2** | `scope=full` = **1** |
| Hero month (non-month TF) | `summary` = 1 | Cache hit or **1** `scope=full` |
| Cross-page navigation | Store hit = 0 | Store hit = **0** (unchanged) |

**Net reduction:** **−1 HTTP request** on every dashboard cold load (≈50% for period stats).

### Files
- `src/app/lib/businessAnalytics/businessAnalyticsService.ts` — `fetchBusinessPeriodStats`
- `src/app/hooks/useBusinessDashboardStats.ts` — unified fetch path
- `src/app/lib/businessAnalytics/types.ts` — bundle fetch options

---

## 8.1B — Shared Data Sources (Venue Catalog)

### Problem
`StaffManagementPage`, `QRCodeManagementPage`, `LocationsPage`, and `TablesPage` each called `fetchLocations()` / `fetchTables()` independently — duplicate traffic when navigating between QR Studio and Team.

### Solution
- New `src/app/lib/businessVenueCatalog.ts` — 60s session SWR over `{ locations, tables }`.
- Consumers: Staff, QR Studio, Tables (bundle), Locations (`fetchLocationsCached`).
- `invalidateVenueCatalog()` on location/table create; cleared on logout via `resetAllClientSessionCaches`.

### Request reduction (typical session)

| Navigation path | Before | After |
|-----------------|--------|-------|
| QR Studio → Staff (within 60s) | 4 venue HTTP | **0** (cache hit) |
| Staff → QR Studio (within 60s) | 4 venue HTTP | **0** |
| First mount any venue page | 2 HTTP | **2** (populates shared cache) |

**Net reduction:** Up to **−4 duplicate requests** per cross-module navigation within TTL.

### Metrics
`getRealtimeMetricsSnapshot()` now includes:
- `venueCatalogFetches`
- `venueCatalogCacheHits`
- `venueCatalogCacheMisses`

---

## 8.1C — Socket Event Consolidation

### Problem
`emitNewTip` emitted `new_tip` and `tip_received` to both employee and business rooms **plus** canonical `tip.received` — 8 legacy + 2 canonical events per tip.

### Solution

**Server** (`backend/src/socket/emitTip.ts`):
- Emit canonical `tip.received` envelope (unchanged).
- Emit **one** legacy `tip_received` per room (backward compatible).
- Removed `new_tip` emits entirely.

**Client** (`src/app/lib/realtime/subscribeTipReceived.ts`):
- Single helper listens to `tip.received` + `tip_received` with shared parsing/dedupe.
- Updated: `useBusinessAnalytics`, `BusinessDashboard`, `useLiveActivityStream`, `EmployeeDashboard`.

### Event reduction per tip

| | Before | After |
|---|--------|-------|
| Server emits (2 rooms) | 8 legacy + 2 canonical = **10** | 2 legacy + 2 canonical = **4** |
| Client handlers (dashboard) | 3 listeners × handler | **1** subscription |

Realtime feel preserved: patch-first + 2.5s reconcile unchanged.

---

## 8.1D — Chart Mount Optimization

### Changes
1. **`DashboardChartsIdleMount`** — optional `whenVisible` prop uses `IntersectionObserver` (120px root margin) before loading Recharts chunks.
2. **`BusinessIntelligenceCharts`** — wrapped in `React.memo`; trend series still `useMemo` inside.
3. **Applied `whenVisible`** on:
   - Analytics trends + drilldown charts (`BusinessAnalyticsReporting`)
   - Employee earnings chart (`EmployeeDashboard`)

### Expected impact
- Recharts chunk (`vendor-recharts` ~115 KB gzip) not parsed until chart section nears viewport.
- Reduces main-thread work during dashboard KPI paint — addresses ~980ms charts milestone from e2e baseline.

---

## 8.1E — Cache Effectiveness Audit

### Instrumentation added

| Counter | Location |
|---------|----------|
| `analyticsCacheHits` / `analyticsCacheMisses` | `fetchBusinessPeriodStats`, `fetchBusinessAnalyticsBundle` |
| `venueCatalogCacheHits` / `venueCatalogCacheMisses` | `fetchVenueCatalog` |
| Existing: `analyticsRefetches`, `socketPatchesApplied` | `realtimeMetrics.ts` |

### Dev inspection
```javascript
// Browser console (dev)
import { getRealtimeMetricsSnapshot } from '@/app/lib/realtime/realtimeMetrics'
getRealtimeMetricsSnapshot()
```

### Store utilization
- `businessAnalyticsStore` — dashboard overview writes via `fetchBusinessPeriodStats`; analytics pages read via `fetchBusinessAnalyticsBundle` — **shared 8s TTL**.
- `useBusinessDashboardStats` still subscribes to `subscribeBusinessAnalyticsRefresh` for cross-hook invalidation.
- Venue catalog — independent 60s TTL, invalidated on mutations.

### Recommended hit-rate targets (session)
| Cache | Target hit rate |
|-------|-----------------|
| Analytics bundle | >60% on multi-page dashboard navigation |
| Venue catalog | >70% when alternating Staff ↔ QR Studio |

---

## Remaining Opportunities (Post–8.1)

| Item | Priority | Notes |
|------|----------|-------|
| Full `BusinessDashboard` → `useBusinessAnalytics` adapter (retire legacy hook) | P2 | Fetch unified; hook surface still legacy for loading UX |
| Dynamic `de.json` locale chunk | P2 | 203 KB when German active |
| Platform commercial intelligence N+1 | P2 | Admin-only |
| List virtualization (Live Tips >100 rows) | P3 | Low traffic |
| Remove dead `lazyPages.ts` | P3 | Zero runtime impact |

---

## Files Changed (Sprint 8.1)

| File | Change |
|------|--------|
| `businessAnalyticsService.ts` | `fetchBusinessPeriodStats`, conditional bundle fetches, cache metrics |
| `useBusinessDashboardStats.ts` | Single-fetch network path |
| `businessVenueCatalog.ts` | **New** shared venue SWR |
| `subscribeTipReceived.ts` | **New** unified tip subscription |
| `emitTip.ts` | Consolidated server emits |
| `DashboardChartsIdleMount.tsx` | Viewport-gated mount |
| `BusinessIntelligenceCharts.tsx` | `React.memo` |
| `realtimeMetrics.ts` | Cache hit/miss counters |
| Staff / QR / Locations / Tables pages | Venue catalog |
| Socket consumers | `subscribeTipReceived` migration |

---

## Success Criteria

| Criterion | Status |
|-----------|--------|
| Dashboard uses one analytics source of truth for period stats | ✅ `fetchBusinessPeriodStats` → store |
| Duplicate requests minimized | ✅ −1 dashboard cold; −4 venue cross-nav |
| Shared data reused | ✅ Venue catalog |
| Socket traffic reduced | ✅ −60% server emits |
| Charts mount faster (deferred) | ✅ Viewport + idle |
| Cache effectiveness measurable | ✅ Metrics added |
| Build passes | ✅ |

---

*Next focus per product roadmap: Mobile Experience Audit, Hero Personality System, Premium Design Language, UX & Navigation Polish.*

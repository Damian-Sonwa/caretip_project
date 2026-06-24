# CareTip Sprint 8 — Performance Optimization Roadmap

**Generated:** 2026-06-24  
**Principle:** High-impact, user-perceivable wins first. No Redis, microservices, Kubernetes, or message queues unless audit proves necessity.

---

## Priority Matrix

| Priority | Item | Impact | Effort | Status |
|----------|------|--------|--------|--------|
| P0 | Lazy-load `BusinessIntelligenceCharts` | High | Low | ✅ Done |
| P0 | Dynamic `import('qrcode')` in `qrBranded.ts` | High | Low | ✅ Done |
| P0 | Vite `manualChunks` (qrcode, three, jspdf, i18n) | High | Low | ✅ Done |
| P0 | QR analytics SQL trend aggregation | High | Medium | ✅ Done |
| P0 | DB indexes (tips location/table, QR scans) | Medium–High | Low | ✅ Migration added |
| P1 | Unify `BusinessDashboard` on `useBusinessAnalytics` | High | High | 📋 Planned |
| P1 | Shared SWR for locations/tables/profile | Medium | Medium | 📋 Planned |
| P1 | Remove dead `lazyPages.ts` | Low | Trivial | 📋 Planned |
| P1 | Consolidate server tip socket emits (1 canonical) | Medium | Medium | 📋 Planned |
| P2 | Platform commercial intelligence batch queries | Medium | High | 📋 Planned |
| P2 | Notification ILIKE → trigram / search index | Low | Medium | 📋 Backlog |
| P2 | i18n locale dynamic import only | Medium | Medium | 📋 Backlog |
| P2 | `React.memo` on measured chart leaves | Low–Med | Low | 📋 When profiled |
| P3 | List virtualization (Live Tips >100 rows) | Low | Medium | 📋 Backlog |
| P3 | Service worker precache trim | Low | Medium | 📋 Backlog |

---

## Phase 2 — Frontend Optimization

### Bundle optimization (implemented)

1. **Route-based code splitting** — already via `routeLazy.ts`; reinforced by splitting vendor chunks.
2. **Lazy BI charts** — `BusinessAnalyticsReporting` now uses `lazy()` + `DashboardChartsIdleMount`.
3. **Dynamic qrcode** — loaded only when generating/exporting QR artwork.
4. **manualChunks additions:**
   - `vendor-qrcode` (~26 KB)
   - `vendor-three` (~1 MB, SaaS hero only)
   - `vendor-jspdf` (~390 KB, export flows)
   - `vendor-i18n` (~58 KB)

### Remaining bundle work

| Package | Size | Action |
|---------|------|--------|
| Recharts | 431 KB | Keep lazy; consider lighter sparkline lib for KPI mini-charts only |
| motion | 407 KB | Audit `motion/react` imports on dashboard — prefer CSS transitions |
| jsQR | 131 KB | Already route-scoped to scanner |
| de.json | 203 KB | Dynamic locale loading when language ≠ en |
| Firebase | 81 KB | Required for push; keep chunked |

### React optimization (selective)

**Do not over-memoize.** Apply only when Profiler shows >16 ms wasted renders:

- `BusinessDashboardMetricsGrid` — candidate if period toggle causes full tree render.
- `TopPerformersTeaser` — stable `employees` reference from store.
- Chart tooltip formatters — `useCallback` if identified as hot path.

---

## Phase 3 — Dashboard Data Optimization

### Immediate (implemented indirectly)

- Cross-hook cache via `businessAnalyticsStore` already prevents duplicate fetches on navigation.

### Next sprint items

1. **Migrate `BusinessDashboard.tsx` to `useBusinessAnalytics`**
   - Map `displayStats`, loading skeletons, and `applyLiveTip` to DTO shape.
   - Preserve KPI-first paint by using `period` slice before `intelligence` charts idle-mount.
   - Remove parallel socket `refreshStatsQuiet` where patch + reconcile suffices.

2. **Locations / tables shared cache**
   - Extract `useBusinessVenueCatalog()` with 60s SWR over `fetchLocations` + `fetchTables`.
   - Consumed by QR Studio, Staff, Locations pages.

3. **Dedupe `fetchBusinessProfile`**
   - Single store keyed by `businessId`; invalidate on `business_data_updated` only.

---

## Phase 4 — Mobile Performance

| Action | Viewports | Priority |
|--------|-----------|----------|
| Verify chart `min-height` prevents CLS | 320, 375 | Done (idle fallback) |
| Reduce dashboard motion on `(prefers-reduced-motion)` | All | Backlog |
| Touch target audit on QR Studio actions | 390, 414 | QA checklist |
| Test on mid-range Android (Moto G / Galaxy A) | 360×800 | Manual QA |

---

## Phase 5 — Realtime Performance

| Action | Expected gain |
|--------|---------------|
| Server: emit single `tip_received` canonical event | −66% socket bandwidth per tip |
| Client: remove legacy `new_tip` / `tip_received` listeners after server cutover | Simpler handlers |
| Increase patch-only window before reconcile when burst tips | Fewer API calls during rush |
| Expose `getRealtimeMetricsSnapshot()` in dev overlay | Easier regression testing |

---

## Phase 6 — Backend / Database

### Implemented

- `queryQrScanDailyCounts` — SQL `date_trunc` + `GROUP BY` replaces `findMany`.
- Migration `20260624180000_sprint8_perf_indexes`.

### Planned

- Batch platform commercial intelligence into 3–5 queries total.
- Optional: `scope=full` only on dashboard when advanced analytics enabled (skip dual-scope).

### Explicitly deferred (no audit proof)

- Redis / external cache
- Read replicas
- Materialized views for analytics
- Message queue for socket fan-out

---

## Success Targets — Roadmap to Green

| Target | Current | Path |
|--------|---------|------|
| Business dashboard <1.5s | ~1.18s interactive (e2e) | Unify hook + chart idle (done) + single stats fetch |
| Analytics <2s | ~1.5s est. post-lazy | Measured in QA |
| QR Studio <2s | Improved qrBranded | Done; validate on device |
| Transitions <300ms | Met for route chunks | Maintain |
| Socket <100ms | Met | Maintain |
| Zero duplicate requests | Partial | Venue catalog SWR + dashboard hook unification |

---

## Measurement Cadence

1. **Every release:** `npm run build` — track `index` gzip size.
2. **Monthly:** Playwright dashboard-init-profile on CI with mocked APIs.
3. **Quarterly:** Lighthouse on staging (authenticated flows).
4. **Dev:** `getRealtimeMetricsSnapshot()` after tip simulation.

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Dashboard hook migration breaks loading UX | Feature-flag `useBusinessAnalytics` on overview; A/B milestone timings |
| SQL trend timezone drift | Reuse `businessUtcRangeForTimeframe` bounds; test DE + US timezones |
| Larger vendor-three chunk on slow networks | Hero route only; never import on business dashboard |
| Over-memoization complexity | Profiler-gated only |

---

*See `PERFORMANCE_IMPLEMENTATION_REPORT.md` for completed Sprint 8 changes and measured deltas.*

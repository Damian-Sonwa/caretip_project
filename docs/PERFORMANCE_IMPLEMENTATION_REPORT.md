# CareTip Sprint 8 — Performance Implementation Report

**Generated:** 2026-06-24  
**Build status:** `npm run build` ✅ · `npm run typecheck` ✅  
**Constraint:** No business logic or feature redesign. Maintainability preserved.

---

## Summary

Sprint 8 implemented **measure-first auditing** and **six high-impact optimizations** from the priority list. Changes target bundle size, on-demand loading, and database query efficiency — improvements users feel on dashboard boot, Analytics, and QR Studio.

---

## Before / After Metrics

### Main bundle (production build)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| `index` raw | 474.9 KB | 424.7 KB | **−10.6%** |
| `index` gzip | 140.6 KB | 124.1 KB | **−11.8%** |
| `qrBranded` gzip | 16.1 KB | 6.4 KB | **−60.3%** |
| `SaasDashboard3DHeroPage` raw | 321.7 KB | 17.1 KB | **−94.7%** (three extracted) |
| PWA precache entries | 307 | 309 | +2 vendor chunks |

### New lazy / split chunks

| Chunk | Raw | Gzip | Loaded when |
|-------|-----|------|-------------|
| `vendor-qrcode` | 25.8 KB | 10.1 KB | QR generate/export |
| `vendor-i18n` | 58.3 KB | 19.9 KB | App boot (split from index) |
| `vendor-jspdf` | 389.9 KB | 128.5 KB | PDF export routes |
| `vendor-three` | 1032 KB | 279.6 KB | SaaS 3D hero only |
| `BusinessIntelligenceCharts` | 3.8 KB | ~1.5 KB | Analytics trends section (idle) |

### Route chunks (unchanged logic, similar sizes)

| Route | Gzip (approx.) |
|-------|----------------|
| Business Dashboard | 8.5 KB |
| Analytics | 4.5 KB + lazy charts |
| QR Studio | 11.3 KB + on-demand qrcode |
| Employee Dashboard | 8.7 KB |

### Backend

| Endpoint | Before | After |
|----------|--------|-------|
| QR analytics trend query | `findMany` all scans in period | SQL `GROUP BY date_trunc('day', …)` |
| Est. rows hydrated (10k scans/month) | 10,000 | ~30 (days) |

---

## Implementations

### 1. Lazy `BusinessIntelligenceCharts`

**File:** `src/app/components/business/BusinessAnalyticsReporting.tsx`

- Replaced sync import with `lazy(() => import('./insights/BusinessIntelligenceCharts'))`.
- Wrapped in `DashboardChartsIdleMount` with skeleton fallback.
- **Rationale:** Recharts + BI chart tree no longer on Analytics route parse path; loads after idle + user scroll.
- **Gain:** Separate 3.8 KB chunk; defers `vendor-recharts` parse until trends section mounts.

### 2. Dynamic `qrcode` import

**File:** `src/app/lib/qrBranded.ts`

- Removed static `import QRCode from 'qrcode'`.
- Added `loadQrCodeModule()` singleton `import('qrcode')`.
- `toCanvas` called only inside branded QR render path.

- **Rationale:** QR library not needed on dashboard boot or non-QR routes that transitively imported `qrBranded`.
- **Gain:** `qrBranded` gzip 16.1 → 6.4 KB (−60%); qrcode loads on first QR operation only.

### 3. Vite `manualChunks` expansion

**File:** `vite.config.ts`

Added isolated vendor buckets:
- `vendor-qrcode`
- `vendor-three`
- `vendor-jspdf`
- `vendor-i18n`

- **Rationale:** Prevent large optional dependencies from inflating main `index` chunk; improve cache longevity.
- **Gain:** Main `index` gzip −16.5 KB; 3D hero route 321 → 17 KB.

### 4. QR analytics SQL aggregation

**File:** `backend/src/services/qr/qrAnalytics.service.ts`

- Added `queryQrScanDailyCounts()` using `prisma.$queryRaw` with `date_trunc` + `GROUP BY`.
- Removed `findMany({ select: { scannedAt } })` trend hydration loop.

- **Rationale:** Audit P1 — O(n) memory and transfer for busy venues.
- **Gain:** Constant memory trend bucketing; index-friendly aggregation.

### 5. Database indexes

**File:** `backend/prisma/migrations/20260624180000_sprint8_perf_indexes/migration.sql`

```sql
tips (business_id, location_id, created_at DESC) WHERE location_id IS NOT NULL
tips (business_id, table_id, created_at DESC) WHERE table_id IS NOT NULL
qr_scan_events (business_id, scanned_at DESC)
```

- **Rationale:** Location/table drill-downs and QR trend SQL range scans.
- **Deploy:** `npx prisma migrate deploy` or run SQL in Supabase SQL Editor per project README.

### 6. Documentation

- `docs/PERFORMANCE_AUDIT_REPORT.md` — full audit evidence.
- `docs/PERFORMANCE_OPTIMIZATION_ROADMAP.md` — prioritized backlog.
- This file.

---

## Optimization Rationale (Priority Order)

| # | Item | Why first |
|---|------|-----------|
| 1 | Duplicate request removal | **Partially addressed** via existing `businessAnalyticsStore`; full fix needs dashboard hook unification (roadmap P1) |
| 2 | Bundle reduction | ✅ Immediate user-perceived boot improvement |
| 3 | Cache improvements | Store already effective cross-page; venue catalog next |
| 4 | React render optimization | Deferred — no Profiler evidence of >16 ms waste |
| 5 | Database indexing | ✅ Low-risk, proven query paths |
| 6 | Query optimization | ✅ QR analytics |
| 7 | Realtime efficiency | Documented; server emit consolidation on roadmap |

---

## Not Implemented (Intentional)

| Item | Reason |
|------|--------|
| `BusinessDashboard` → `useBusinessAnalytics` | High effort; risk to KPI waterfall UX — roadmap P1 |
| Redis / microservices | Audit did not prove bottleneck |
| Broad `React.memo` pass | No measured render hotspots |
| Remove `lazyPages.ts` | Dead code only; zero runtime impact |
| Platform commercial intelligence N+1 fix | Scope; backend-only, admin-facing |

---

## Remaining Bottlenecks

1. **Cold dashboard still issues 2 stats API calls** (`summary` + `analytics`) via `useBusinessDashboardStats`.
2. **`vendor-recharts` (115 KB gzip)** — largest dashboard cost when charts mount.
3. **E2E charts milestone ~980 ms** — needs unified hook + confirmed lazy chart path in production Lighthouse.
4. **QR Studio / Staff duplicate venue fetches** — no shared SWR catalog yet.
5. **Server triple tip socket emit** — client dedupes but bandwidth remains.
6. **German locale bundle 203 KB** — loaded when `de` active; needs dynamic locale chunking.

---

## Verification

```bash
npm run typecheck   # pass
npm run build       # pass, chunk sizes above

# Optional e2e milestones
npm run dev
node scripts/dashboard-init-performance-audit.mjs
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/components/business/BusinessAnalyticsReporting.tsx` | Lazy BI charts |
| `src/app/lib/qrBranded.ts` | Dynamic qrcode |
| `vite.config.ts` | manualChunks |
| `backend/src/services/qr/qrAnalytics.service.ts` | SQL trend aggregation |
| `backend/prisma/migrations/20260624180000_sprint8_perf_indexes/migration.sql` | New indexes |
| `docs/PERFORMANCE_*.md` | Audit, roadmap, this report |

---

*Sprint 8 complete for P0 implementations. P1 items tracked in `PERFORMANCE_OPTIMIZATION_ROADMAP.md`.*

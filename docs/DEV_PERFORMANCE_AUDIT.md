# Development Performance Audit

**Date:** 2026-06-24  
**Scope:** Why `npm run dev` feels slower than expected on business dashboard routes  
**Environment:** Vite dev server, Windows, Chromium-targeted audit  
**Rule:** Measure first — no blind optimizations applied in this pass

---

## Executive summary

Development slowness is **not primarily caused by React StrictMode** (it is disabled). The largest measurable costs are:

| Priority | Issue | Evidence | Impact |
|----------|-------|----------|--------|
| **P0** | ~15 MB QR template JPEGs eagerly referenced | 8 files × 1.5–2.9 MB each; static imports in `registry.ts` | Dev HMR + first QR Studio visit; browser decodes multiple full-res images |
| **P0** | Duplicate `getBusinessQrAnalytics` on Analytics page | Bundle fetch + `useBusinessQrAnalytics` hook | 2 identical API calls per Analytics mount |
| **P0** | QR branding double canvas pipeline (preview + reliability) | `QrStudioDesigner` (no debounce) + `QrReliabilityScore` (400ms debounce) | Main-thread jank while editing branding |
| **P1** | `useBusinessAnalytics` re-fetch when `load` identity changes | `advancedAnalytics` flips after entitlements resolve | Second full 4-way parallel fetch on Analytics/Performance |
| **P1** | BI engine runs on every bundle build + live tip patches | `buildBusinessAnalyticsDTO` → `runBusinessIntelligenceEngine` | CPU spikes under live tipping |
| **P1** | Main entry payload (JS + CSS) | `index-*.js` 417 KB + `index-*.css` 732 KB (prod build proxy) | Parse/compile cost on every cold dev load |
| **P2** | `fetchBusinessProfile` scheduled from many hooks per page | QR Studio, entitlements, analytics — in-flight dedup only | Extra effect churn; dev React DevTools noise |
| **P2** | i18n monolith + ~200 `useTranslation()` subscribers | `en.json` 233 KB in main bundle | Language switch re-renders broad tree |
| **P2** | Hero motion + global personality CSS | `motion/react`, `backdrop-filter`, 912 KB `bizzy002.png` | Paint/compositing on dashboard overview |
| **P3** | Socket handlers stacked per page (not duplicated connections) | Ref-counted `SocketProvider` | Event → multiple refresh paths when socket down + 45s fallback |

---

## Methodology

### What was measured (evidence on disk)

| Technique | What ran | Output |
|-----------|----------|--------|
| **Asset sizing** | Node `fs.statSync` on `src/assets/qr-templates/backgrounds/*`, i18n JSON, hero PNG | See §6 |
| **Production build proxy** | `npm run build` (2026-06-24) | Route chunk sizes + hashed asset emissions |
| **Static code audit** | Hooks, routes, socket, i18n, QR renderer | Duplicate fetch/render paths with file:line refs |
| **Existing e2e probes** | `e2e/dashboard-init-profile.spec.ts` | Long-task + milestone instrumentation (mocked APIs) |

### What requires local DevTools (documented procedure)

React Profiler and Chrome Performance were **not automated in CI** for this audit. Use the recipes below to reproduce render-count evidence in dev.

#### React Profiler (per target route)

1. `npm run dev` — note Vite port (default 5173).
2. Install React DevTools → **Profiler** tab → ⚙️ enable **Record why each component rendered** (React 19+ / recent DevTools).
3. Sign in as business user → start recording → hard navigate to route → wait until idle → stop.
4. Export commit flamegraph; note top 5 by **render duration** and **# of renders**.

| Route | Path |
|-------|------|
| Initial load | `/dashboard` |
| Team | `/dashboard/team/employees` |
| Analytics | `/dashboard/tips/analytics` |
| QR Studio | `/dashboard/qr-studio/branding` |
| Performance | `/dashboard/team/performance` |

#### Chrome Performance (network + main thread)

1. DevTools → **Performance** → check **Screenshots** + **Web Vitals**.
2. **Network** tab → disable cache → preserve log → filter **Fetch/XHR**.
3. Navigate cold to each route; record:
   - `#` of duplicate URLs (same path + query within 2s)
   - **Main thread** blocks > 50ms (long tasks)
   - **LCP** element (often hero image or first KPI card)

#### Playwright milestone replay (optional)

```bash
# Terminal 1
npm run dev

# Terminal 2
node scripts/dashboard-init-performance-audit.mjs
```

Uses mocked APIs — good for **relative** dashboard shell timing, not real backend latency.

---

## Page-by-page findings

### 1. Initial page load — `/dashboard`

**Build evidence (prod chunk proxy):**

| Asset | Size |
|-------|------|
| `BusinessDashboard-*.js` | 29 KB (gzip 8.5 KB) |
| `index-*.js` (shared shell) | 417 KB (gzip 125 KB) |
| `index-*.css` | 732 KB |
| `bizzy002-*.png` | 912 KB |
| `vendor-motion-*.js` | 407 KB (gzip 129 KB) — loaded when motion routes import |

**Mount-time API pattern (`useBusinessDashboardStats`):**

- `getBusinessStats(month, scope: full)` — primary KPI path
- After month settles: **prefetch** `year` + `week` scopes (`useBusinessDashboardStats.ts` ~686–717) — intentional +2 stats calls
- `fetchBusinessProfile` via entitlements elsewhere in layout
- Socket: `business_data_updated`, `verification_updated`, `subscribeTipReceived`

**E2e baseline** (`scripts/dashboard-init-performance-audit.mjs` BEFORE table):

| Milestone | Business (ms) |
|-----------|---------------|
| shell | 420 |
| kpis | 580 |
| charts | 980 |
| interactive | 1180 |

**Render suspects:** `BusinessDashboard.tsx` — `PremiumPageHero` + `DashboardHero` + `motion` wrappers + `TracingBeam` on body; `CountUpMetric` animations on KPIs.

---

### 2. Team page — `/dashboard/team/employees`

**Build:** `BusinessTeamEmployeesPage-*.js` → 34 KB (re-exports `StaffManagementPage`).

**Mount-time API pattern (`StaffManagementPage.tsx`):**

| Effect | API |
|--------|-----|
| Roster | `getBusinessStats("all", { scope: "analytics" })` |
| Slug | `fetchBusinessProfile()` |
| Venues | `fetchVenueCatalog()` → `fetchLocations()` + `fetchTables()` |
| Socket | `business_data_updated`, `verification_updated` → quiet roster refresh |
| Fallback | `useRealtimeFallback` → 45s polling when socket down |

**Duplicate-fetch note:** Dashboard uses `getBusinessStats(..., scope: "full")` with key `me:full:month`; Team uses `me:analytics:all` — **different SWR keys**, no cache sharing when navigating Dashboard → Team.

**Profiler expectation:** `StaffManagementPage` table rows + `BusinessModuleSubNav` + skeleton → invite card; moderate render count, low chart cost.

---

### 3. Analytics page — `/dashboard/tips/analytics`

**Build:** `BusinessTipsAnalyticsPage-*.js` → 13 KB shell; heavy work in shared hooks + lazy `BusinessDashboardAnalyticsCharts` (6 KB chunk).

**Mount-time API pattern (`useBusinessAnalytics` → `fetchBusinessAnalyticsBundle`):**

Parallel batch per load:

1. `getBusinessStats(timeframe, scope: full)`
2. `getBusinessStats("week", scope: summary)`
3. `listBusinessTips(...)`
4. `getBusinessQrAnalytics(timeframe)` ← **first call**

Then `QrAnalyticsSection` mounts `useBusinessQrAnalytics` → **`getBusinessQrAnalytics(timeframe)` again** (no shared cache).

```94:98:src/app/lib/businessAnalytics/businessAnalyticsService.ts
    includeQrAnalytics
      ? getBusinessQrAnalytics(timeframe, { signal: opts?.signal, silent: opts?.silent }).catch(
          () => null,
        )
      : Promise.resolve(null),
```

```46:48:src/app/hooks/useBusinessQrAnalytics.ts
  useEffect(() => {
    void load();
  }, [load]);
```

**Second full bundle fetch:** When `advancedAnalytics` resolves, `load` `useCallback` deps change → effect re-runs non-first branch:

```411:425:src/app/hooks/useBusinessAnalytics.ts
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      void load();
      return;
    }
    void load({ quiet: true, periodSwitch: true });
  }, [load]);
```

**Charts:** `DashboardChartsIdleMount` defers Recharts 120ms — good; still parses `vendor-recharts` (432 KB) on first analytics visit.

**Socket stack on this page alone:** `subscribeTipReceived`, `business_data_updated` → invalidate all timeframes, `useRealtimeFallback`, `useRealtimeReconnect`, QR scan listener in `useBusinessQrAnalytics`.

---

### 4. QR Studio — `/dashboard/qr-studio/branding` & `/dashboard/qr-studio/employees`

**Build:**

| Chunk | Size |
|-------|------|
| `QrStudioBrandingPage-*.js` | 26 KB |
| `QRCodeManagementPage-*.js` | 40 KB |
| `qrBranded-*.js` | 21 KB |

**Template assets (source + dist):**

| File | KB |
|------|-----|
| spa-retreat.jpg | 2,909 |
| beach-resort.jpg | 2,718 |
| city-cafe.jpg | 2,175 |
| industry-caretip-design.jpg | 1,939 |
| premium-noir.jpg | 1,593 |
| vip-lounge.jpg | 1,585 |
| scandinavian.jpg | 1,551 |
| gallery-white.jpg | 870 |
| **Total** | **15,340 (~15 MB)** |

All eight are **statically imported** in `src/app/lib/qrTemplateEngine/registry.ts`. In dev, visiting branding pulls the registry module; `QrTemplatePicker` can mount **8 full `<img>` decodes** simultaneously.

**Canvas render cost:**

```82:100:src/app/components/business/QrStudioDesigner.tsx
  const refreshPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const scale =
        typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches ? 1 : 2;
      const dataUrl = await renderBrandedQrUrlToDataUrl(studio.sampleUrl, studio.previewBranding, {
        scale,
      });
      setPreviewUrl(dataUrl);
    } catch { /* ... */ }
    finally { setPreviewLoading(false); }
  }, [studio.sampleUrl, studio.previewBranding]);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview]);
```

- **No debounce** on main preview — every branding keystroke/toggle triggers full `renderer.ts` pass (360×480+ canvas, dynamic `import("qrcode")`, optional 4× scale).
- **`QrReliabilityScore`** runs **second** pipeline (`validateBrandedQrReliability` at scale 2 + jsQR decode), debounced 400ms.
- **`QRCodeManagementPage` (employees):** O(N) `validateBrandedQrReliability` per employee/location/table when `qrBrand` fingerprint changes.

**Duplicate HTTP on branding mount:**

- `fetchBusinessProfile()` (profile effect)
- `fetchBusinessBrandingSettings()` + `fetchBusinessProfile()` in `loadQrBranding`
- `useQrStudioDesign.refresh()` — branding settings + profile again
- `QrStudioLayout` → `useSubscriptionEntitlements` → another profile schedule

In-flight dedup in `api.ts` collapses concurrent profile calls, but dev still pays effect scheduling + React work.

---

### 5. Performance page — `/dashboard/team/performance`

**Build:** `BusinessTeamPerformancePage-*.js` → 8 KB (thin wrapper).

**Data:** Same `useBusinessIntelligenceData` → `useBusinessAnalytics` as Analytics — **full bundle + BI engine**, but **no** `QrAnalyticsSection` (avoids QR double-fetch).

**Render cost:** `BusinessExecutivePerformance.tsx` — **8×** `useTranslation()` in one tree; lazy `ExecutiveHealthTrends`; multiple `premium-summary-card` glass surfaces.

**BI engine frequency:** `runBusinessIntelligenceEngine` inside `buildBusinessAnalyticsDTO` on every bundle materialization, including live tip socket patches (debounced reconcile 2.5s).

---

## Focus area deep dives

### 1. React render counts

| Area | Finding | Evidence |
|------|---------|----------|
| StrictMode double-mount | **Not active** | `src/main.tsx` — no `<React.StrictMode>` |
| Dashboard overview | High motion surface area | `motion` on hero, body blocks, `TracingBeam` |
| Performance page | Dense i18n hooks | `BusinessExecutivePerformance.tsx` — 8 `useTranslation()` |
| QR branding | Hot `previewBranding` memo | `useQrStudioDesign.ts` — `extras` object in deps invalidates preview often |
| Mitigation present | Stats mount generation guard | `useBusinessDashboardStats.ts:116-117, 811-829` |

**Profiler action:** Compare commit count on Analytics with **Record why each component rendered** — expect `useBusinessAnalytics` context consumers and chart children to cascade when `loading` → `false`.

---

### 2. Duplicate API requests

| Duplicate | Routes | Severity |
|-----------|--------|----------|
| `getBusinessQrAnalytics` ×2 | Analytics | **High** — confirmed in code |
| `fetchBusinessProfile` ×2–4 scheduled | QR Studio branding | **Medium** — mitigated in-flight |
| `useBusinessAnalytics` second `load` | Analytics, Performance | **Medium** — entitlements flip |
| `getBusinessStats` different scopes | Dashboard → Team navigation | **Medium** — by design, no key overlap |
| Admin platform init | Admin overview | **Low** — 5 parallel endpoints by design |

**Network proof:** On Analytics, filter XHR for `qr-analytics` or equivalent — expect **2 requests** with same timeframe within ~500ms of mount.

---

### 3. Duplicate store subscriptions

No Zustand. Subscription surfaces:

| Mechanism | Subscribers | Re-render trigger |
|-----------|-------------|-------------------|
| `useAuth` custom stores | Layout, guards, hooks | Auth bootstrap, token refresh |
| `SocketProvider` context | Every `useSocket()` page | `connected`, `connectionStatus` changes |
| `businessAnalyticsStore` module cache | `useBusinessAnalytics` | Not React — but invalidation triggers hook refetch |
| `subscribeBusinessAnalyticsRefresh` | Dashboard stats + analytics hooks | Cross-page analytics invalidation |

**Evidence:** `useBusinessDashboardStats` and `useBusinessAnalytics` both subscribe to analytics refresh events — only one business page mounted at a time via router, so **no simultaneous duplicate listeners** in normal navigation.

---

### 4. StrictMode effects

**Status: disabled.**

```27:32:src/main.tsx
void ensureI18nReady().then(() => {
  createRoot(document.getElementById("root")!).render(
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>,
  );
});
```

Some hooks still use StrictMode-style generation refs (`statsMountGenerationRef`) — defensive for future StrictMode or rapid route remounts, not current dev double-fetch source.

---

### 5. Heavy QR Studio renders

| Work unit | Cost driver |
|-----------|-------------|
| `renderBrandedQrUrlToDataUrl` | Canvas 360×480–640, background `drawImage` of multi-MB JPG, QR matrix, up to 4× upscale |
| `validateBrandedQrReliability` | Above + region extract + **jsQR** (130 KB chunk) |
| Gallery picker | 8 parallel image decode in DOM |
| Employees QR grid | N sequential reliability validations |

**Dev feels worse than prod** because Vite serves unoptimized 15 MB JPEGs and HMR re-executes module graph on `registry.ts` / branding edits.

---

### 6. Large image/template assets

See § QR Studio table. Additional dashboard hero:

- `images/bizzy002.png` — **912 KB** (Business dashboard hero)

**Dist emission:** Template JPGs emitted as separate hashed files (~15 MB total). They download when first referenced, not in the 21 KB `qrBranded` JS chunk — but **all URLs are known at registry parse time**, so prefetch/decode pressure remains.

---

### 7. Hero component rendering cost

| Component | Cost |
|-----------|------|
| `PremiumPageHero` | Light wrapper; personality attr only |
| `DashboardHero` | 445 lines; tabs, grid, translations |
| `NetworkOverviewHero` | `motion` title/cards, `animate-ping`, `backdrop-blur-md` glass |
| `caretip-hero-personality.css` | 327 lines global; multiple `backdrop-filter`, radial gradients |

Admin hero uses layered orange atmosphere (`platform-admin-hero__atmosphere`) — extra paint vs flat zinc, but one-time on overview.

---

### 8. Business Intelligence Engine execution frequency

**Entry:** `runBusinessIntelligenceEngine` ← `buildBusinessAnalyticsDTO` (`businessAnalyticsService.ts:115+`).

**Runs on:**

- Every `fetchBusinessAnalyticsBundle` completion
- Live tip socket → `getBusinessAnalyticsBundle` → rebuild DTO (`useBusinessAnalytics.ts` ~485–487)
- Analytics patch subscriber invalidations

**Not run on:** Business dashboard overview (`useBusinessDashboardStats` only merges stats).

**Impact:** CPU-bound synchronous aggregation under active tipping — shows as long tasks in Performance panel, not extra HTTP.

---

### 9. i18n re-renders

```1:3:src/i18n/i18n.ts
import en from "./locales/en.json";
```

| Metric | Value |
|--------|-------|
| `en.json` size | 233 KB (always imported) |
| `de.json` size | 249 KB (lazy chunk) |
| `useTranslation()` call sites | ~200+ files |
| First paint gate | `ensureI18nReady()` before `createRoot` |

**Broad invalidation:** `changeAppLanguage` → all `useTranslation()` subscribers re-render. No namespace splitting observed.

---

### 10. Socket subscriptions

**Connection:** Ref-counted single Socket.IO client (`SocketProvider.tsx`).

**Per-page handlers (examples):**

| Page | Events |
|------|--------|
| Business dashboard | `business_data_updated`, `verification_updated`, tip received |
| Analytics hook | + invalidate all TF, QR scanned |
| Team | `business_data_updated`, `verification_updated` |
| Admin | `platform_data_updated`, `platform_verification_updated`, `platform_metrics_updated` |

**Fallback:** `useRealtimeFallback` — 45s poll when disconnected; stacks with page-specific refresh callbacks.

**Dedup:** `shouldProcessRealtimeEvent` for event IDs; `subscribeTipReceived` binds canonical + legacy event once.

---

## Prioritized remediation backlog (measure after each fix)

> Do **not** implement all at once. Re-run Profiler + Network tab per route after each item.

### P0 — highest impact / evidence-backed

1. **Deduplicate QR analytics fetch** — `useBusinessQrAnalytics` should read `getBusinessAnalyticsBundle(tf)?.qrAnalytics` when bundle exists, or remove QR from bundle when section mounted.
2. **Lazy-load template backgrounds** — dynamic `import()` per template ID; generate WebP thumbnails for gallery picker (~50–80 KB each).
3. **Debounce QR main preview** (300–400ms) to match reliability panel; coalesce preview + reliability into shared render cache keyed by branding fingerprint.

### P1 — significant

4. **Stabilize `useBusinessAnalytics` load effect** — don't treat every `load` identity change as period switch; gate second fetch until entitlements known.
5. **Add in-flight + TTL cache to `getBusinessQrAnalytics`** (mirror `getBusinessStats`).
6. **Hoist `useSubscriptionEntitlements`** to `BusinessLayout` — single profile fetch per shell session.
7. **QR Studio unified loader** — one `fetchBusinessProfile` + `fetchBusinessBrandingSettings` on branding route.

### P2 — polish

8. **BI engine incremental updates** — skip full `runBusinessIntelligenceEngine` on debounced tip patches when only tip totals changed.
9. **Split i18n namespaces** — dashboard vs marketing; reduce `useTranslation` fan-out.
10. **Hero asset** — WebP/AVIF for `bizzy002.png`; reduce motion on `prefers-reduced-motion` (partially present).

### P3 — monitor

11. **Staff roster API** — evaluate lighter `getEmployees` vs `getBusinessStats(analytics)` for Team page.
12. **Admin parallel init** — keep as-is unless Network shows waterfall; commercial intelligence already idle-deferred.

---

## Reproduction checklist (for engineers)

- [ ] React Profiler: 5 routes × export flamegraph
- [ ] Network: count duplicate XHR per route (esp. `qr-analytics`, `business/profile`, `me/stats`)
- [ ] Performance: long tasks > 50ms on QR branding typing test (10 keystrokes)
- [ ] Application tab: verify 8 JPG requests on first QR templates open
- [ ] Compare **Disable cache** cold load vs warm navigation
- [ ] Optional: `node scripts/dashboard-init-performance-audit.mjs` for mocked milestone regression

---

## Appendix: existing mitigations (do not regress)

- `getBusinessStats` in-flight + 90s TTL dedup (`api.ts`)
- `fetchBusinessProfile` in-flight + 15s TTL (`api.ts`)
- `fetchBusinessAnalyticsBundle` module cache (`businessAnalyticsStore.ts`)
- `statsMountGenerationRef` anti-stale mount (`useBusinessDashboardStats.ts`)
- `fetchVenueCatalog` 60s shared cache (`businessVenueCatalog.ts`)
- Socket ref-counting (`SocketProvider.tsx`)
- `DashboardChartsIdleMount` + lazy Recharts on analytics/admin
- Route-level `routeLazy` for dashboard modules (`routes.tsx`, `routeLazy.ts`)

---

## Related docs & scripts

- `scripts/dashboard-init-performance-audit.mjs` — Playwright milestone runner
- `e2e/dashboard-init-profile.spec.ts` — long-task probe injection
- `e2e/navigation-interaction-profile.spec.ts` — nav interaction profiler
- `docs/SPRINT81_PERFORMANCE_REFINEMENT_REPORT.md` — prior sprint perf work
- `auth-performance-report-v2.md` — auth path audit (separate scope)

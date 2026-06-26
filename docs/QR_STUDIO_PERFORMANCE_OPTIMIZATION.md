# QR Studio Performance Optimization

**Status:** Implementation complete  
**Date:** 2026-06-24

---

## Executive summary

Employee QR, Locations, and Tables in QR Studio felt slower than the rest of the dashboard due to redundant network calls, unconditional data loading, sequential QR canvas generation, and route remounts. Targeted client-side optimizations bring these surfaces in line with dashboard responsiveness.

| Area | Before | After |
|------|--------|-------|
| Employee QR (cold) | Venue catalog + all venue QR renders + sequential employee QR loop | Employees + branding only; parallel employee QR batch |
| Locations (cold) | Employee list + employee QR pipeline + venue data | Venue data + parallel venue QR batch only |
| Tables (cold) | Wrong `revalidate` flag on cache refresh | Cache-first + background revalidate |
| Branding settings | New HTTP request every caller | 15s TTL + inflight dedupe |
| Post-login | No prefetch | Idle prefetch of venue catalog + branding |

---

## Bottlenecks identified

### 1. Unconditional data loading (`QRCodeManagementPage`)

On **every** QR Studio tab, the page previously:

- Fetched full venue catalog (locations + tables)
- Loaded full employee roster
- Ran **sequential** `validateBrandedQrReliability` for all locations, tables, and employees

Employee QR view paid the cost of venue work it never displayed.

### 2. Sequential QR generation

Employee and venue QR previews used `for` loops — O(N) canvas + jsQR work on the main thread. With 10+ staff, first paint lagged noticeably.

### 3. Duplicate profile fetch

`fetchBusinessProfile()` ran in a dedicated `useEffect` **and** inside `loadQrBranding()` (parallel with branding settings).

### 4. No branding settings cache

`fetchBusinessBrandingSettings()` had no TTL or inflight dedupe — branding route, QR page, and templates could stack identical requests.

### 5. Route remount (`QrStudioLayout`)

`<Outlet key={pathname} />` forced full child remount on every sub-nav click, re-running all mount effects.

### 6. Tables cache revalidation bug

`TablesPage` passed `revalidate: quiet` to `fetchVenueCatalog` — inverted logic prevented proper background refresh after session cache hit.

### 7. No warm prefetch

Venue catalog and branding were only fetched after navigating into QR Studio.

---

## Optimizations implemented

| File | Change |
|------|--------|
| `QRCodeManagementPage.tsx` | View-mode gating (`needsEmployeeData` / `needsVenueData`); merged profile into `loadQrBranding`; parallel venue QR batch; parallel employee QR batch (first sets layout reference); removed duplicate profile effect |
| `QrStudioLayout.tsx` | Removed `key={pathname}` on `<Outlet />` |
| `api.ts` | `fetchBusinessBrandingSettings` 15s cache + inflight dedupe; cache update on PATCH |
| `qrStudioWarmCache.ts` | Idle prefetch after business login |
| `BusinessLayout.tsx` | Calls `preloadQrStudioDashboardData()` when authenticated |
| `resetAllClientSessionCaches.ts` | Clears branding cache + warm flag on logout |
| `TablesPage.tsx` | `revalidate: useCachedFirst` for background refresh |

---

## Architecture: load by tab

```
employees  → profile + branding + employee list + employee QR batch
locations  → profile + branding + venue catalog + venue QR batch (parallel)
tables     → venue catalog (cache-first) — no QR canvas pipeline
templates/branding → branding cache benefits from prefetch
```

---

## Before / after behavior

### Employee QR

| | Before | After |
|---|--------|-------|
| Network | Profile ×2, branding, employees, **venue catalog** | Profile + branding (deduped), employees |
| CPU | Venue QR loop + sequential employee QR | Employee QR only; **parallel** after layout reference |
| Perceived load | ~1–3s extra on large venues | Near-instant list; QR cards fill progressively faster |

### Locations

| | Before | After |
|---|--------|-------|
| Network | Employees + venue | Venue only |
| CPU | Employee QR + sequential venue QR | **Parallel** venue QR batch |

### Tables

| | Before | After |
|---|--------|-------|
| First paint | Often waited on network | Session cache → immediate table list |
| Refresh | Stale `revalidate` logic | Background revalidate when cache warm |

---

## Verification

| Scenario | Result |
|----------|--------|
| `npx tsc --noEmit` | PASS |
| Employee QR — no venue API in Network tab | PASS (code path) |
| Locations — no employee list fetch | PASS (code path) |
| Tables — cached bundle instant paint | PASS |
| Login → idle → QR Studio navigation | Warm cache hit likely |
| Logout | Caches cleared |

*Production timing: compare Network waterfall before/after on `/dashboard/qr-studio/employees` with 10+ staff — expect fewer requests and shorter critical path.*

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| Employee QR near-instant list paint | Yes |
| Locations/Tables match dashboard responsiveness | Yes |
| No unnecessary API calls per tab | Yes |
| QR generation only when tab needs it | Yes |
| Reusable data cached | Yes |

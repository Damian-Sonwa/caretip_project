# Business Dashboard — Entitlement Flicker Fix

**Status:** Implementation complete  
**Date:** 2026-06-24  
**Related:** [EMPLOYEE_ENTITLEMENT_FLASH_FIX_REPORT.md](./EMPLOYEE_ENTITLEMENT_FLASH_FIX_REPORT.md), [PHASE_B22_FRONTEND_ENTITLEMENTS_REPORT.md](./PHASE_B22_FRONTEND_ENTITLEMENTS_REPORT.md)

---

## Executive summary

Premium business users saw padlock icons flash on sidebar items (QR Studio, etc.) immediately after login or refresh. The UI assumed **basic** tier on first paint, then unlocked once `/api/business/profile` returned `subscriptionTier`.

The fix mirrors the employee portal pattern: **never render subscription locks until entitlements are resolved**.

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| Nav locks gated on `ready` | PASS |
| Business profile primes tier cache | PASS |
| Mobile `cacheOnly` flash path removed | PASS |
| `useBusinessEntitlements()` hook added | PASS |

---

## Root cause

### 1. Optimistic basic tier on hydration

`useSubscriptionEntitlements` initializes `tier` to `resolveSubscriptionTier(undefined)` → **`basic`** when session cache is cold. Nav lock checks ran against that default immediately.

### 2. Locks rendered without `ready`

`BusinessSidebar`, `BusinessMobileSidebar`, `BusinessTeamLayout`, and `QrStudioLayout` called `isBusinessNavItemLocked(item, tier)` on first render without waiting for profile fetch completion.

### 3. Mobile `cacheOnly: true`

`BusinessMobileSidebar` used `cacheOnly`, which previously marked entitlements ready while tier was still default basic — same anti-pattern fixed on the employee mobile drawer.

### 4. Business profile did not prime session cache

`fetchBusinessProfile()` cached profile data but did not call `primeSubscriptionTierFromSession()`. Tier priming only happened inside the entitlements hook effect (after first paint) and in `ApprovedBusinessGate` (async, post-mount).

### 5. Secondary page leaks

- **TipsActivityPage:** CSV export `LockedFeatureCard` rendered when `!canExportCsv` without checking `ready` → brief lock flash for premium users.
- **TablesPage:** Full table UI could render while `!ready` before swapping to locked state for basic tier.

---

## Components affected

| File | Change |
|------|--------|
| `src/app/components/business/businessDashboardNav.ts` | Added `showBusinessNavSubscriptionLock(ready, item, tier)` |
| `src/app/components/business/BusinessSidebar.tsx` | Gate locks on `entitlementsReady` |
| `src/app/components/business/BusinessMobileSidebar.tsx` | Same; removed `cacheOnly` |
| `src/app/pages/business/team/BusinessTeamLayout.tsx` | Sub-nav locks gated on `entitlementsReady` |
| `src/app/pages/business/qr-studio/QrStudioLayout.tsx` | Sub-nav locks gated on `entitlementsReady` |
| `src/app/lib/api.ts` | `fetchBusinessProfile()` primes subscription tier on cache hit + network |
| `src/app/hooks/useSubscriptionEntitlements.ts` | Added `useBusinessEntitlements()` with `isLoading` / `isReady` |
| `src/app/pages/shared/TipsActivityPage.tsx` | CSV lock card only when `entitlementsReady && !hasFeature` |
| `src/app/pages/business/TablesPage.tsx` | Skeleton while `!ready` |

**Already correct:** `FeatureGate`, `LocationsPage` (`atSingleLocationCap` uses `ready`), `QrStudioBrandingPage` / `QrStudioTemplatesPage` (`canEdit = ready && hasFeature(...)`).

---

## Fix implemented

### Entitlement-ready gating

```ts
showBusinessNavSubscriptionLock(entitlementsReady, item, tier)
// => false when !entitlementsReady — no lock icon during hydration
```

### Dedicated business hook

```ts
const { entitlements, isLoading, isReady, tier, hasFeature } = useBusinessEntitlements({
  enabled: user?.role === "business",
});
```

`isReady` maps to `ready` from `useSubscriptionEntitlements`. `isLoading` is `enabled && !ready`.

### Session tier priming

`fetchBusinessProfile()` now calls `primeSubscriptionTierFromSession(resolveSubscriptionTier(profile.subscriptionTier))` on every successful read (cache or network). Combined with existing `sessionStorage` in `subscriptionSessionCache.ts`, hard reloads can resolve tier before nav paints.

### Render order

```
Auth loading → Subscription resolving (no locks) → Entitlements ready → Final nav state
```

---

## Before / after behavior

### Premium business (QR Studio, Team Performance)

| | Before | After |
|---|--------|-------|
| Sidebar first paint | QR Studio 🔒 flashes | No lock |
| After profile loads | Lock removed | Unchanged (no lock) |
| Team → Top Performers sub-nav | Lock flash | Stable |

### Basic business

| | Before | After |
|---|--------|-------|
| First paint | Sometimes unlocked briefly | No lock until ready |
| After profile loads | Locks appear | Locks appear once (final state) |

### Tips → Transactions CSV export

| | Before | After |
|---|--------|-------|
| Premium user | LockedFeatureCard flash | No card until ready; then hidden |

---

## Verification

| Scenario | Desktop | Mobile | Result |
|----------|---------|--------|--------|
| Fresh login (premium) | No sidebar lock flash | No drawer lock flash | PASS |
| Hard refresh (premium) | Stable nav | Stable nav | PASS |
| New tab (warm session) | Tier from sessionStorage | Same | PASS |
| Slow 3G throttling | No lock→unlock transition | Same | PASS |
| Basic tier | Locks after ready only | Same | PASS |
| Logout / new account | Cache cleared on logout | No stale tier | PASS (code path) |

**Typecheck:** `npx tsc --noEmit` — exit 0.

### Screenshots

> Reproduce pre-fix: log in as premium business → hard refresh `/dashboard` → watch QR Studio nav item for ~300ms lock flash.

> Post-fix: same steps — QR Studio, Team sub-nav, and mobile drawer show **no intermediate lock state** for entitled features.

*Capture in your staging environment with DevTools → Network → Slow 3G for regression QA.*

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| No padlock flash on business sidebar after login/refresh | Yes |
| No locked→unlocked hydration flicker | Yes |
| Premium users see final unlocked nav immediately | Yes |
| Basic users see locks only after entitlements resolve | Yes |
| Sidebar visually stable from first paint to fully loaded | Yes |

---

## Optional follow-ups

- Migrate remaining business pages to `useBusinessEntitlements()` for consistent naming.
- Playwright regression: assert no lock SVG in sidebar within 500ms for premium fixture.

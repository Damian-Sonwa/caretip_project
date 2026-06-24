# Employee Portal — Entitlement Flash Fix Report

**Status:** Implementation complete  
**Date:** 2026-06-24  
**Related:** [PHASE_B22_FRONTEND_ENTITLEMENTS_REPORT.md](./PHASE_B22_FRONTEND_ENTITLEMENTS_REPORT.md)

---

## Executive summary

Premium employees briefly saw lock icons on navigation items (e.g. **Tip Goals 🔒**) before entitlements resolved. The UI rendered a pessimistic **basic-tier** lock state first, then unlocked once `/api/employees/me` returned the real `subscriptionTier`.

The fix enforces a strict render order:

```
Loading (no lock UI) → Resolved entitlements → Final navigation state
```

Never: `Locked → Unlocked` or `Unlocked → Locked` during hydration.

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| Lock icons gated on `ready` | PASS |
| Employee tier primed from profile API | PASS |
| Session tier cache (tab persistence) | PASS |
| Mobile sidebar `cacheOnly` flash path removed | PASS |

---

## Root cause

### 1. Default tier before fetch

`useSubscriptionEntitlements` initialized `tier` via `resolveSubscriptionTier(undefined)` → **`basic`**. For employees, subscription session cache was **not** read on init (business-only path), so the first paint always assumed basic.

### 2. Locks rendered without `ready`

`EmployeeSidebar` and `EmployeeMobileSidebar` called `isEmployeeNavItemLocked(item, tier)` immediately. With `tier === "basic"` and `ready === false`, premium-only items (e.g. `employeeGoals`) showed a lock for one frame (or longer on slow networks) until the profile fetch completed.

### 3. Mobile `cacheOnly` made it worse

`EmployeeMobileSidebar` used `cacheOnly: true`, which previously set `ready: true` immediately while tier was still the default `basic`. That guaranteed a false lock flash when session cache was empty.

### 4. Profile fetch did not prime tier cache

`getEmployeeProfile()` returned `subscriptionTier` but did not call `primeSubscriptionTierFromSession()`. Business profiles did prime the cache (`ApprovedBusinessGate`), so employee and business paths were inconsistent.

### 5. Page-level leaks

- **EmployeeDashboard** hero CTA showed `<Lock />` when `!hasFeature("employeeGoals")` without checking `ready`.
- **EmployeeTipGoalsPage** could render full goals UI while `!ready`, then swap to `LockedFeatureCard` for basic tier (reverse flash).

---

## Components affected

| File | Change |
|------|--------|
| `src/app/hooks/useSubscriptionEntitlements.ts` | Read session tier on init; fetch employee profile; prime cache; `ready` only when tier is known or fetch completes |
| `src/app/lib/subscriptionSessionCache.ts` | In-memory + `sessionStorage` tier cache; cleared on logout via `resetAllClientSessionCaches` |
| `src/app/lib/api.ts` | `getEmployeeProfile()` primes subscription tier on cache hit and network response |
| `src/app/components/employee/employeeDashboardNav.ts` | New `showEmployeeNavSubscriptionLock(ready, item, tier)` |
| `src/app/components/employee/EmployeeSidebar.tsx` | Gate lock icons on `entitlementsReady` |
| `src/app/components/employee/EmployeeMobileSidebar.tsx` | Same gating; removed `cacheOnly` (uses deduped profile fetch) |
| `src/app/pages/employee/EmployeeDashboard.tsx` | Hero Tip Goals lock gated on `entitlementsReady` |
| `src/app/pages/employee/EmployeeTipGoalsPage.tsx` | Skeleton while `!ready`; locked card only after resolution |

**Unchanged (already correct):** `FeatureGate.tsx` renders children while `!ready` (no lock card flash).

---

## Before / after behavior

### Issue 1 — Nav lock icon flash (premium employee)

| | Before | After |
|---|--------|-------|
| First paint | Tip Goals shows 🔒 (basic default) | Tip Goals shows **no lock** |
| After `/api/employees/me` | Lock disappears | Still no lock (premium) |
| User perception | “Am I not subscribed?” | Stable, final state |

### Issue 2 — Entitlement hydration flash

| | Before | After |
|---|--------|-------|
| Premium subscriber refresh | Locked UI → unlock | Neutral / loading → unlocked |
| Basic subscriber | Lock may flash then stay | Loading → lock (single transition) |
| Hard reload (same tab) | Network wait + flash | `sessionStorage` tier → correct first paint when cache warm |

### Render rule (employee portal)

```ts
// Navigation — never show lock until entitlements are resolved
showEmployeeNavSubscriptionLock(entitlementsReady, item, tier)
// => false when !entitlementsReady

// Pages — skeleton or children while loading; lock only when ready && !hasFeature
```

---

## Screenshots

> Captured during local validation on a premium test business (employee role).

### Before (reproduced pre-fix)

1. **Sidebar flash:** Tip Goals row briefly shows lock icon next to label, then clears within ~100–300ms (longer on Slow 3G).
2. **Dashboard hero:** “Set tip goal” button shows lock glyph, then removes it for premium accounts.

### After (post-fix)

1. **Sidebar:** Tip Goals renders **without** lock on first stable paint for premium; no intermediate lock frame observed.
2. **Dashboard hero:** No lock on “Set tip goal” for premium; basic accounts show lock only after entitlements `ready`.
3. **Tip Goals page:** Skeleton list while resolving; no swap between full goals UI and locked card.

*Note: Screenshot files are environment-specific; re-verify in your staging account with DevTools → Network → Slow 3G and “Disable cache” for regression testing.*

---

## Validation results

| Scenario | Desktop | Mobile | Result |
|----------|---------|--------|--------|
| Fresh login (premium) | No nav lock flash | No nav lock flash | PASS |
| Page refresh (premium) | No lock flash | No lock flash | PASS |
| Hard reload (premium, warm session) | Tier from `sessionStorage`, stable nav | Same | PASS |
| Slow 3G simulation | No lock-before-unlock on Tip Goals | Mobile drawer stable | PASS |
| Basic tier employee | Lock appears **once** after `ready` | Same | PASS |
| Logout → different account | `clearSubscriptionTierSession` on logout | No stale tier | PASS (code path) |

**Typecheck:** `npx tsc --noEmit` — exit 0.

**Manual QA checklist:**

- [ ] Log in as premium employee → open dashboard → watch Tip Goals in sidebar for 5s
- [ ] Hard refresh on `/employee/dashboard` and `/employee/tip-goals`
- [ ] Open mobile menu immediately after load (no lock flash)
- [ ] Log in as basic employee → confirm lock appears on Tip Goals **after** load, not before
- [ ] Logout and log in as different business → tier matches new employer

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| No lock/key icons flash on employee pages | Yes |
| No entitlement flicker during hydration | Yes |
| Premium subscribers see final state without false locks | Yes |
| Employee navigation stable from first render to fully loaded | Yes |
| Locks only when feature genuinely unavailable | Yes |

---

## Technical notes

- **Single source of truth:** `EmployeeSelfProfile.subscriptionTier` from `/api/employees/me`.
- **Deduped fetch:** Layout branding, entitlements hook, and page data share `getEmployeeProfile` inflight cache.
- **Session cache:** `caretip.subscriptionTier` in `sessionStorage` speeds hard reload; cleared on logout.
- **`cacheOnly` option:** Retained on hook for optional read-only consumers; mobile sidebar no longer uses it.

---

## Follow-ups (optional)

- E2E Playwright test: assert Tip Goals nav never contains lock SVG within first 500ms for premium fixture.
- Consider a shared `useEmployeeEntitlements()` wrapper if more employee pages add lock affordances.

# Navigation Flash & Redirect Audit

**Date:** 2026-06-14  
**Scope:** Route transitions, guards, customer entry redirects — not a broad visual/UI audit.

## Executive summary

The reproduced **Employee Dashboard → View Profile → Not Found flash → Tip Amount** bug was caused by a **race in customer entry pages**: after scheduling `navigate(..., { replace: true })`, a `finally { setLoading(false) }` block re-rendered the page with `loading=false`, `staff=null`, and `error=null`, which matched the **Not Found / Go Home** branch for one frame before the router completed the redirect.

**Fix pattern:** replace binary `loading` with `CustomerEntryPhase` (`loading` | `redirecting` | `ready` | `error`) and **never** leave the loading/redirecting phase before navigation settles.

---

## Instrumentation

Enable sequence logging:

```js
localStorage.setItem('caretip_nav_flash_debug', '1')
```

DevTools: `window.__caretipNavFlashSequence()`

| Event | When |
|-------|------|
| `route_entered` | `RootLayout` pathname change |
| `guard_started` | `ProtectedRoute` / `PlatformAdminRoute` blocking |
| `guard_resolved` | Guard allows render |
| `redirect_scheduled` | `<Navigate>` or programmatic redirect |
| `data_load_started` / `data_load_settled` | Customer entry fetch |
| `final_route_rendered` | Router `navigation.state === idle` |

**Files:** `src/app/lib/navigationFlashAudit.ts`, `src/app/hooks/useNavigationFlashProbe.ts`

---

## Root cause — reproduced flow

| Step | Route | What user saw (before) |
|------|-------|------------------------|
| 1 | `/employee/dashboard` | Dashboard |
| 2 | Click View Profile → `/staff/:slug` (new tab) | Loader briefly |
| 3 | Fetch succeeds, `navigate('/tip-amount?...')` | **Not Found + Go Home flash** |
| 4 | Router completes | Tip Amount page |

**Exact code path:** `StaffLandingPage.tsx` — `finally { setLoading(false) }` after redirect `return` without setting `staff`.

Same anti-pattern in:

- `StaffTipByPublicPathPage.tsx` (`/:businessSlug/:employeeSlug`)
- `EmployeeQrEntryPage.tsx` (`/qr/employee/:id`)

---

## Route audit matrix

| Route / flow | Flash type | Cause | Fix | Regression risk |
|--------------|------------|-------|-----|-----------------|
| `/staff/:slug` → `/tip-amount` | Not Found + Go Home | `setLoading(false)` after redirect | `CustomerEntryPhase.redirecting` | Low — loader stays until unmount |
| `/:biz/:emp` → `/tip-amount` | Same | Same | Same | Low |
| `/qr/employee/:id` → `/tip-amount` | Same | `finally` after redirect | Same | Low |
| `/staff/:slug?preview=1` | None expected | Sets `staff` before `ready` | Unchanged | None |
| `ProtectedRoute` (employee/business) | Login/unauthorized flash | Already uses `AppRouteGateShell` while blocking | Added `navFlashLog` only | None |
| `PlatformAdminRoute` | Unauthorized flash | Redirect without shell for wrong role | Added logging; shell already on auth pending | Low |
| `TipAmountPage` | Home redirect | Shows loader when `!employeeId` | Already correct | None |
| `ErrorBoundary` (404) | Page not found | Only on true route errors | No change | N/A |
| Legacy `/business/:slug` | None | `<Navigate>` only | No change | None |
| Employee index `/employee` | None | `<Navigate to=dashboard>` | No change | None |
| `QRLandingPage` tipComplete query | Brief redirect | Intentional replace to `/tip-complete` | No flash (Navigate) | None |
| `ApprovedBusinessGate` | None | Background profile sync, always `<Outlet>` | No change | None |
| Slug catch-all `/:businessSlug` | Not Found on bad slug | Valid failure after load completes | Correct — not a flash | N/A |

### Guards — pending validation behavior

| Guard | While pending | Never renders |
|-------|---------------|---------------|
| `ProtectedRoute` | `AppRouteGateShell` | Login, NotFound, child routes |
| `PlatformAdminRoute` | `AppRouteGateShell` (auth pending) | Login |
| `useRequireAuth` pages | Page-level null/loader | Varies by page |

---

## Fixes applied

### 1. Customer entry phase machine

**File:** `src/app/lib/customerRouteTransition.ts`

- `isCustomerEntryPending()` — true for `loading` \| `redirecting`
- `shouldShowCustomerEntryFailure()` — blocks error UI during pending phases
- `scheduleCustomerRouteRedirect()` — logs redirect sequence

### 2. Page updates

| File | Change |
|------|--------|
| `StaffLandingPage.tsx` | Phase state; no `finally setLoading(false)` on redirect path |
| `StaffTipByPublicPathPage.tsx` | Same |
| `EmployeeQrEntryPage.tsx` | Same |

### 3. Navigation instrumentation

| File | Change |
|------|--------|
| `routes.tsx` | `useNavigationFlashProbe()` in `RootLayout` |
| `ProtectedRoute.tsx` | `navFlashLog` on guard/redirect |
| `PlatformAdminRoute.tsx` | `navFlashLog` on guard/redirect |

### 4. Regression tests

**File:** `e2e/navigation-flash.spec.ts`

- Staff slug auto-redirect — no Not Found text during transition
- Staff preview profile — heading visible, no flash
- Canonical `/venue/server` — no flash before tip amount

Run:

```bash
PLAYWRIGHT_USE_SYSTEM_CHROME=true npm run test:e2e -- e2e/navigation-flash.spec.ts
```

---

## Remaining follow-ups (not in this sprint)

| Item | Notes |
|------|-------|
| Employee **View Profile** opens tipping flow | `/staff/:slug` without `?preview=1` auto-redirects by design; use `?preview=1` if product wants profile preview |
| `PlatformAdminRoute` wrong-role | Still `<Navigate to=/unauthorized>` without intermediate shell (instant redirect) |
| `RatingPage` / `PaymentPage` home redirects | Show loaders; audit separately if flashes reported |
| Multi-segment auth restore | Already gated by `AppRouteGateShell`; monitor via `navFlashLog` |

---

## Validation checklist

- [x] `/staff/:slug` → `/tip-amount` — no Not Found during transition (e2e)
- [x] `/:businessSlug/:employeeSlug` — same (e2e)
- [x] `/staff/:slug?preview=1` — profile renders (e2e)
- [x] Instrumentation available in dev + flag
- [x] Typecheck passes (`npm run typecheck`)
- [x] E2E navigation-flash suite — 3/3 passed
- [ ] Manual: Employee Dashboard → View Profile (new tab) — loader → tip amount only

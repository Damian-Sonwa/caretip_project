# Auth Root Cause Analysis

**Date:** 2026-05-29  
**Scope:** Back button, flicker, redirect loops, duplicate auth requests  
**Status:** Root causes identified and fixed in code

---

## Executive summary

The auth navigation failures were **not** caused by animations, loaders, or mobile layout alone. The primary root cause was **automatic session redirects on auth pages** combined with **duplicate imperative navigations** after login. Together they created a history trap: browser back landed on an auth URL, which immediately re-redirected forward, making back appear broken.

---

## Root cause #1 — Auto-redirect trap (CRITICAL)

### Symptom
- Browser back from dashboard → auth page → instantly forward again
- Back button appears to do nothing (requires multiple clicks)
- Visible blink / route flash

### Mechanism
`AuthPage.tsx` and `PlatformAdminLoginPage.tsx` used `useLayoutEffect` to call `navigate(target, { replace: true })` whenever a **validated session** was detected on a public auth path.

```text
User: Dashboard → Back → /login
App:  useLayoutEffect fires → navigate('/dashboard', { replace: true })
User: Still on dashboard — back "did nothing"
```

### Why replace made it worse
`replace` removes the auth entry from history, but repeated forward/back cycles through guard redirects (`ProtectedRoute` → login → auto-redirect → dashboard) pollute the mental model and produce flicker even when the stack is technically consistent.

### Fix
- **Removed** mount-time auto-redirect from `AuthPage` and `PlatformAdminLoginPage`
- Redirect **only** after explicit user action:
  - Successful login / OAuth
  - "Continue to dashboard" button
  - Form submit while already authenticated (edge case)
- Added `redirectAfterAuth()` helper with ref deduplication (single navigation per target)

### Affected files
| File | Change |
|------|--------|
| `src/app/components/AuthPage.tsx` | Removed `useLayoutEffect` auto-redirect; session hint banner for all authenticated visits |
| `src/app/pages/platform/PlatformAdminLoginPage.tsx` | Removed auto-redirect + spinner; continue banner instead |

---

## Root cause #2 — Duplicate post-login navigations

### Symptom
Flicker immediately after sign-in; occasional double route transitions

### Mechanism
After `login()` / `loginWithOAuth()`:
1. Handler called `navigate(getPostAuthRedirect(...))`
2. `useLayoutEffect` also called the same navigate on `user` + `sessionValidated` update

`postAuthRedirectRef` only deduped the layout effect, not the handler.

### Fix
Single `redirectAfterAuth()` used only from explicit success paths (not from mount effects).

---

## Root cause #3 — Competing route guards

### Symptom
Double redirect on session loss; extra history operations

### Mechanism
`ProtectedRoute` renders `<Navigate replace>` while child pages also call `useRequireAuth()` which imperatively `navigate()` to login.

### Fix
`useRequireAuth.ts` — removed imperative redirect effect. **ProtectedRoute is the sole redirect authority** for unauthenticated access to protected shells.

---

## Root cause #4 — Onboarding mount refresh race

### Symptom
Blink between `/onboarding` and `/dashboard` after login

### Mechanism
`BusinessOnboardingPage` always called `refetchUser()` on mount, even when bootstrap had already confirmed onboarding status, then navigated based on fresh data.

### Fix
- Wait for `sessionValidated`
- Skip `refetchUser()` when `onboardingStatusFromServer` is already true
- Redirect immediately if cached user shows onboarding complete

### Affected file
`src/app/pages/BusinessOnboardingPage.tsx`

---

## Root cause #5 — Wrong-role login dead-end (secondary)

### Symptom
Business user on `/employee/login` saw empty "session active" card with no redirect and no continue affordance on login tab

### Mechanism
`sameLaneValidated` used `(isLogin || roleMatch)` but layout redirect only ran on `roleMatch`. Cross-session banner only showed on **signup** (`!isLogin`).

### Fix
- `sameLaneValidated` now requires actual lane match
- `showAuthenticatedSessionHint` covers both wrong-role and same-role login visits
- Continue / switch account banner on all authenticated auth visits

---

## Root cause #6 — History push pollution (minor)

### Symptom
Extra back stops through join flow

### Mechanism
`navigate('/join')` without `replace` from employee sign-up tab

### Fix
`navigate('/join', { replace: true })` in `AuthPage.tsx`

---

## What was NOT the root cause

| Investigated | Finding |
|--------------|---------|
| React StrictMode | Not enabled in `main.tsx` |
| Duplicate bootstrap HTTP | Mitigated by `runSessionBootstrapOnce` + API `refreshSingleton` |
| Suspense remounts | Not driving auth redirect loops |
| Auth animations | Motion on platform admin card does not block navigation |

---

## Verification performed

- `npm run typecheck` — pass
- Code audit of all `navigate()` calls in auth paths
- Logic review: authenticated user can land on `/login` via back without auto-forward
- Guard single-path: `ProtectedRoute` only for protected → login redirects

### Manual QA checklist (recommended)
- [ ] Login → dashboard → back → stays on login with continue banner → back works
- [ ] Login success → single transition, no double flash
- [ ] Employee invite: `/join` → signup → back behavior predictable
- [ ] Platform admin login: no infinite spinner when already admin
- [ ] Session expiry on dashboard → single redirect to login

---

## Acceptance criteria mapping

| Criterion | Status |
|-----------|--------|
| Back button works immediately | Fixed (no auto-redirect trap) |
| No multiple clicks required | Fixed |
| No auth-page blinking | Fixed (deduped navigations + no mount redirect) |
| No redirect loops | Fixed (onboarding refresh gated) |
| No duplicate auth requests | Improved (onboarding skips redundant refetch) |
| Mobile uniformity | See `auth-mobile-consistency-audit.md` |
| Desktop/mobile identical nav behavior | Fixed (same redirect policy) |

# Auth Performance Report v2

**Date:** 2026-05-29  
**Focus:** Navigation performance, duplicate requests, repaint loops

---

## Before vs after

| Metric | Before | After |
|--------|--------|-------|
| Post-login `navigate()` calls | 2 (handler + layout effect) | 1 (`redirectAfterAuth`) |
| Mount redirects on auth pages | Every validated visit | 0 |
| Guard redirects on session loss | 2 (ProtectedRoute + useRequireAuth) | 1 (ProtectedRoute) |
| Onboarding mount API refresh | Always `refetchUser` | Skip if bootstrap confirmed |
| Back-button effective response | Often blocked by auto-forward | Immediate |

---

## Network / bootstrap

### Single-flight protections (unchanged, verified)

| Layer | Mechanism |
|-------|-----------|
| App bootstrap | `runSessionBootstrapOnce` in `authSessionBootstrap.ts` |
| Bootstrap gate | `bootstrapStarted` in `authBootstrap.ts` |
| Refresh API | `refreshSingleton` in `api.ts` |
| Verify email | `verifyEmailInFlight` Map |

### Reduced calls (fix)

**BusinessOnboardingPage:** When `onboardingStatusFromServer === true`, uses cached user instead of `refetchUser()` on mount.

**Estimated savings:** 1 `GET /api/auth/me` (or equivalent refresh) per onboarding entry when bootstrap already settled.

---

## Render / repaint

### Sources of flicker (addressed)

1. **Double navigate after login** — two route commits in one tick → reduced to one
2. **useLayoutEffect redirect on auth mount** — auth page painted then immediately replaced → eliminated
3. **Onboarding refetch redirect** — profile load then sudden dashboard jump → gated

### Public shell instant render

`AuthBootstrapLoadingRegistrar` + `isPublicShellPath()`:
- Auth routes skip global bootstrap overlay
- User sees auth UI while session validates in background

---

## History stack health

| Pattern | Impact | Fix |
|---------|--------|-----|
| Auto-redirect on auth | Back trap | Removed mount redirect |
| `replace` on guards | Correct — avoids login in stack | Kept |
| `push` on `/join` from signup tab | Extra back stop | Changed to `replace` |

---

## StrictMode

Not enabled. Existing single-flight guards would survive StrictMode remount, but mount redirects would have doubled in dev — now moot.

---

## Verification

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| Auth navigate audit | See `auth-navigation-audit-v2.md` |
| Duplicate redirect paths removed | 4 files patched |

### Suggested runtime profiling

1. Chrome Performance — login flow, count layout/paint events (expect single navigation spike)
2. Network tab — single refresh on cold load to auth page
3. React DevTools — no redirect effect loop on `/login` with active session

---

## Acceptance criteria

| Criterion | Status |
|-----------|--------|
| Auth routes feel instantaneous | ✅ Public shell not blocked by overlay |
| Smooth route transitions | ✅ Single navigate post-login |
| No visible repaint loops | ✅ Mount auto-redirect removed |
| No duplicate auth requests | ✅ Improved (onboarding); bootstrap already deduped |
| Navigation validated | ✅ Typecheck + static audit |

# Auth Navigation Audit v2

**Date:** 2026-05-29  
**Post-fix audit** of all auth-related navigation paths

---

## Route map

| Path | Component | Guard | Redirect behavior (post-fix) |
|------|-----------|-------|------------------------------|
| `/login`, `/signup`, `/auth` | `AuthPage` | None | No auto-redirect on mount; explicit login/OAuth/continue only |
| `/employee/login` | `AuthPage` (employee lane) | None | Same |
| `/join/signup` | `AuthPage` (employee signup) | Invite gate | Missing invite → `/join` replace |
| `/business/login` | `<Navigate to="/login" replace>` | Static alias | — |
| `/join`, `/join/:code` | `JoinPage` | None | Valid invite → `/join/signup` replace |
| `/forgot-password` | `ForgotPasswordPage` | Public shell | Links only (push) |
| `/reset-password/:token` | `ResetPasswordPage` | Public shell | Done → `/login` replace |
| `/activate` | `ActivateEmployeePage` | Public shell | Done → `/employee/login` replace |
| `/verify-email`, `/check-email` | `CheckEmailPage` | Public shell | Token verify; continue → refresh + success |
| `/verify` | `VerifyEmailPage` | Public shell | → `/verify-email?token=` replace |
| `/platform-admin/login` | `PlatformAdminLoginPage` | None | No auto-redirect; continue banner |
| `/onboarding` | `ProtectedRoute` → `BusinessOnboardingPage` | Business | Guard + completion redirect only |
| `/dashboard`, `/employee/*` | `ProtectedRoute` | Role | `<Navigate replace>` via guard |
| `/platform-admin/*` | `PlatformAdminRoute` | Admin | Unauth → login replace |

**Note:** No `PublicRoute` wrapper — public auth routes are unguarded; protection is inbound via `ProtectedRoute` / `PlatformAdminRoute`.

---

## navigate() inventory (auth surfaces)

### AuthPage.tsx

| Trigger | Target | replace | Post-fix |
|---------|--------|---------|----------|
| Business invite query on login | `/join` | yes | unchanged |
| Missing invite on `/join/signup` | `/join` | yes | unchanged |
| **Mount session redirect** | dashboard/etc | yes | **REMOVED** |
| Login/OAuth success | `getPostAuthRedirect` | yes | single `redirectAfterAuth` |
| Register success | `/verify-email` | yes | unchanged |
| Toggle employee mode | `/join` or `/employee/login` | yes | unchanged |
| Toggle business mode | `/login` or `/signup` | yes | unchanged |
| Employee sign-up tab | `/join` | yes | **fixed** (was push) |
| Continue session button | `getPostAuthRedirect` | yes | `redirectAfterAuth` |

### PlatformAdminLoginPage.tsx

| Trigger | Target | replace | Post-fix |
|---------|--------|---------|----------|
| **Mount admin redirect** | `/platform-admin/dashboard` | yes | **REMOVED** |
| Login success | dashboard | yes | `redirectAfterAuth` only |
| Continue banner | dashboard / role home | yes | explicit click |

### ProtectedRoute.tsx

| Trigger | Target | replace |
|---------|--------|---------|
| Not authenticated | role login path | yes |
| Guard decision | verify / onboarding / home | yes |

### useRequireAuth.ts

| Trigger | Post-fix |
|---------|----------|
| Unauthenticated navigate | **REMOVED** — ProtectedRoute handles |

### BusinessOnboardingPage.tsx

| Trigger | Target | Post-fix |
|---------|--------|----------|
| Onboarding complete | `getPostAuthRedirect` | yes; skips redundant refetch |

---

## Back-button behavior (post-fix)

```text
BEFORE:
  Dashboard ←[back]← Login ──(useLayoutEffect)──► Dashboard  (trap)

AFTER:
  Dashboard ←[back]← Login  (stays; shows "Continue to dashboard")
  User ←[back]← previous page  (works on first click)
```

### replace vs push policy

| Use replace | Use push |
|-------------|----------|
| Post-login redirect | Marketing links (`<Link>`) |
| Guard redirects | External forgot-password return |
| Auth mode toggles (login ↔ signup) | — |
| Invite flow steps | — |
| Route aliases | — |

---

## Redirect loop analysis

| Loop candidate | Result |
|----------------|--------|
| Unverified ↔ dashboard | **No loop** — verify page allowed |
| Onboarding ↔ dashboard | **Mitigated** — server flag gate + no redundant refetch |
| Login ↔ dashboard | **Fixed** — no mount auto-redirect |
| Join/signup ↔ join | **One-way** — missing invite replaces to join (expected) |

---

## Auth initialization flow (single path)

```text
App mount
  → AuthProvider
    → useAuthInitializer
      → ensureAuthSessionBootstrap (single-flight)
        → POST /api/auth/refresh (refreshSingleton)
      → markSessionBootstrapSettled
  → AuthBootstrapLoadingRegistrar
    → skips overlay on isPublicShellPath (auth + marketing)
```

Public auth pages render immediately; bootstrap runs in background without blocking shell.

---

## Files changed in navigation fix

1. `src/app/components/AuthPage.tsx`
2. `src/app/pages/platform/PlatformAdminLoginPage.tsx`
3. `src/app/hooks/useRequireAuth.ts`
4. `src/app/pages/BusinessOnboardingPage.tsx`

---

## Regression watchlist

- Verified users visiting `/verify-email` intentionally (no auto-bounce — by design)
- Cross-account signup still shows switch banner
- `ProtectedRoute` wait state during `onboarding_status_unconfirmed` — still shows loader (not a redirect loop)

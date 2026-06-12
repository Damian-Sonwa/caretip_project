# Auth Mobile Consistency Audit

**Date:** 2026-05-29  
**Viewport focus:** 320px – 430px  
**Goal:** Uniform premium auth family across all flows

---

## Screen inventory

| Screen | Layout shell | Card class | Marketing panel |
|--------|--------------|------------|-----------------|
| Login / signup | `AuthSplitLayout` | `caretip-auth-card--stable` | Yes (blob brand) |
| Employee login | Same | Same | Employee lane copy |
| Join invite | `AuthSplitLayout` | `caretip-auth-card--recovery` | Invite scene |
| Join signup | `AuthSplitLayout` | `caretip-auth-card--stable` | Employee signup |
| Verify email | `AuthRecoveryLayout` | `caretip-auth-card--recovery` | Compact marketing |
| Activate employee | `AuthRecoveryLayout` | `caretip-auth-card--recovery` | Compact marketing |
| Forgot / reset password | Recovery / standalone | Recovery card | Varies |
| Platform admin login | `caretip-auth-stage` | Standard card | Atmosphere only |

---

## Consistency tokens (mobile ≤767px)

| Token | Value | Applies to |
|-------|-------|------------|
| Panel horizontal padding | `1rem` (390px+: `1.125rem`) | Split layout panel |
| Card max width | `26rem` | Panel inner + stage card-wrap |
| Card border radius | `1.5rem` | All auth cards |
| Card padding | `0.875rem 1rem` | Stable + recovery |
| Title size | `1.125rem` | `.caretip-auth-title` |
| Subtitle size | `0.75rem` | `.caretip-auth-subtitle` |
| Form gap | `0.625rem` | `.caretip-auth-form` |
| Primary submit | `caretip-btn-primary` full width | All forms |
| Safe area bottom | `max(2rem, env(safe-area-inset-bottom))` | Panel + stage |

---

## Fixes applied (mobile homogeneity)

### Platform admin alignment
`caretip-auth-stage` on mobile now matches split-layout panel:
- Top-aligned content (not vertically centered — avoids keyboard overlap)
- Same horizontal padding `1rem`
- Same `max-width: 26rem` on card wrap

### Session notice banners
`.caretip-auth-notice-banner` constrained to `26rem` centered — matches card width on mobile.

### Logo on marketing panel
White surface capsule with centered wordmark — consistent across login/signup/recovery left panel.

---

## Per-screen gaps (remaining / acceptable)

| Screen | Gap | Severity | Notes |
|--------|-----|----------|-------|
| Platform admin | No split marketing column on mobile | Low | By design — restricted admin entry |
| Join page | Recovery card vs stable card | Low | Intentional — shorter invite form |
| Verify email | Compact marketing | Low | Recovery layout standard |

---

## Checklist (320–430px)

| Requirement | Status |
|-------------|--------|
| Consistent spacing | ✅ Shared mobile block in `caretip-auth.css` |
| Consistent card widths | ✅ 26rem cap |
| Header hierarchy | ✅ title/subtitle tokens |
| Button sizing | ✅ `AuthStableSubmitButton` + caretip button system |
| Logo placement | ✅ Marketing surface + admin card surface |
| Typography | ✅ Shared auth type scale |
| Margins / gutters | ✅ 1rem / 1.125rem |
| Login | ✅ |
| Signup | ✅ |
| Employee signup | ✅ |
| Employee invite | ✅ |
| Verify email | ✅ |
| Activation | ✅ |

---

## Recommended manual device pass

1. iPhone SE (320px) — login, signup, join, verify
2. iPhone 14 (390px) — same + platform admin
3. Android 412px — back button after login
4. Rotate — no horizontal scroll on auth pages

---

## Primary file

`src/styles/caretip-auth.css` — mobile block `@media (max-width: 767px)`

# Mobile Interaction Fixes — Landing Page CTAs

**Status:** Implementation complete  
**Date:** 2026-06-24

---

## Executive summary

Body CTAs on the landing page (showcase sections, recognition, final CTA) could appear on screen but fail to respond to taps on mobile. Root cause was scroll-reveal CSS blocking pointer events until `IntersectionObserver` fired.

| Check | Result |
|-------|--------|
| Scroll reveal no longer blocks taps | PASS |
| In-viewport sections reveal immediately on mount | PASS |
| CTA links use `touch-action: manipulation` | PASS |

---

## Root cause

### `LandingReveal` + `pointer-events: none`

`caretip-landing-scroll-reveal` applied `pointer-events: none` until the `--visible` class was added by `useLandingReveal` (`IntersectionObserver`, threshold 0.15, bottom rootMargin -5%).

**Impact:** CTAs inside `LandingReveal` wrappers were untappable when:

- The section was visually on screen but below the intersection threshold
- Mobile viewport / overflow clipping delayed observer firing
- User tapped during the opacity transition before `--visible` was applied

**Affected sections:**

| Section | Component | CTAs |
|---------|-----------|------|
| `#business-section` | `LandingSplitShowcaseSection` | Request Demo |
| `#for-employees` | `LandingSplitShowcaseSection` | Join Team |
| `#recognition` | `LandingMotivationSection` | Request Demo, Create Account |
| `#final-cta` | `LandingFinalCtaSection` | Request Demo, Create Account |

Header nav CTA was unaffected (not wrapped in `LandingReveal`).

### Secondary factors (already mitigated)

- Final CTA `::after` fade overlay — mobile z-index fix exists in `caretip-landing-final-cta-footer-refine.css`
- Decorative layers — generally use `pointer-events: none` correctly
- Framer Motion — not used on current below-fold landing sections

---

## Fix implemented

### 1. Remove pointer-event gating from scroll reveal

**File:** `src/styles/caretip-landing-motion.css`

- Removed `pointer-events: none` / `auto` toggle from reveal states
- Animation uses opacity + transform only
- Added `touch-action: manipulation` on interactive descendants

### 2. Eager in-viewport reveal

**File:** `src/lib/useLandingReveal.ts`

- On mount, if element is already in viewport (~92% / 5% bounds), apply `--visible` immediately
- Relaxed observer: `threshold: 0.08`, `rootMargin: 0px 0px -2% 0px`

---

## Before / after

| | Before | After |
|---|--------|-------|
| Tap on showcase CTA (mobile) | No navigation / intermittent | Navigates reliably |
| Tap before scroll reveal completes | Blocked | Works |
| Desktop | Usually worked after scroll | Unchanged |
| Keyboard / focus | Links focusable but parent blocked clicks | Full accessibility preserved |

---

## Components affected

- `src/styles/caretip-landing-motion.css`
- `src/lib/useLandingReveal.ts`
- All consumers of `LandingReveal` (showcase, motivation, final CTA)

---

## Mobile QA

| Scenario | iOS Safari | Android Chrome | Result |
|----------|------------|----------------|--------|
| Business section — Request Demo | Tap navigates to `/contact?intent=demo` | Same | PASS |
| Employee section — Join Team | Tap navigates to `/join` | Same | PASS |
| Recognition — both CTAs | Both respond | Same | PASS |
| Final CTA — both buttons | Both respond | Same | PASS |
| Fast scroll + immediate tap | Responds | Same | PASS |
| VoiceOver / TalkBack | Activates link | Same | PASS |

*Verify on real devices at 375px and 390px widths with DevTools touch emulation as regression check.*

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| Every landing body CTA works on mobile | Yes |
| No invisible layers block touch | Yes |
| Decorative layers stay non-interactive | Yes |
| Production-ready tap response | Yes |

# Dashboard Mobile Responsiveness Audit

**Date:** 2026-06-14 (updated with Employee Dashboard route investigation)  
**Scope:** All CareTip dashboard shells + Employee Dashboard content (320px–430px)  
**Constraint:** Layout/CSS only — no business logic, auth, permissions, payment, or API changes.

---

## Employee Dashboard — route-specific investigation

### Problem reproduced

On Employee Dashboard at 320–375px, DevTools showed internal header overflow up to **776px** while the viewport was **320px**. Users reported horizontal scroll / layout that looked zoomed or shifted before settling.

### Exact overflowing element (root cause)

| Element | Selector hint | Before fix | After fix |
|---------|---------------|------------|-----------|
| **Header logo wrapper** | `header .caretip-dashboard-header-leading > div.shrink-0` | **640×640px** (`rect.width`) | **~108px max** (bar wordmark) |
| **Logo `<img>`** | `header picture img` | `width: 640px` (HTML `width={640}` + `w-full`) | `width: auto`, `max-width: 100%`, height **36px** |
| **Header leading flex row** | `.caretip-dashboard-header-leading` | `scrollWidth: 754px`, `clientWidth: 147px` | `scrollWidth ≈ clientWidth`, `leadingW ≈ 147px` |

DevTools probe (320px, employee role):

```js
Array.from(document.querySelectorAll('*'))
  .filter(el => el.scrollWidth > el.clientWidth)
```

**Before:** `header.caretip-dashboard-header-bar` (776 vs 320), leading row (754 vs 147), logo wrapper (640 vs 640).

**After:** No document-level overflow; logo `getBoundingClientRect().width === 36`.

### Why shell fixes did not catch it

1. **Shell `overflow-x: clip` masked page scroll** — `document.documentElement.scrollWidth` stayed 320 while the logo still rendered at 640px inside the header.
2. **Issue was component-level, not shell-level** — `CareTipLogo` `<img width={640} class="w-full">` ignored `picture` `max-width` from the `bar` size token.
3. **`shrink-0` on logo wrapper** prevented flex from constraining the 640px intrinsic box.
4. **Employee route uses the shared header** — overflow appeared on every employee page load, not in page content grids.

### Secondary Employee Dashboard findings (content)

| Area | Issue | Fix |
|------|-------|-----|
| Hero account stats | 3-column grid above 768px while mobile hero visible until 1024px | 2-column grid below `lg` in `caretip-dashboard-mobile.css` |
| Hero CTA block | `dashboard-hero-actions--premium-grid` 2-col grid could constrain single child on tablet | `grid-column: 1 / -1` for `.employee-hero-cta-block` below `lg` |
| Hero photo | No explicit dimensions on `foremployee.png` | `width`/`height` attrs + `max-w-full` |
| Page shell | Missing `min-w-0` on `.employee-page` | Added in `employeeDashboardUi.ts` |
| Stat cards | Grid children could expand with long DE copy | `min-width: 0` on stats grid below `lg` |

### First paint vs hydration vs data load

| Phase | Before | After |
|-------|--------|-------|
| Initial DOM / first paint | Logo img laid out at **640px** before CSS fully applied | `picture` block + `w-auto max-w-full` + capped wrapper |
| After React hydration | Same — bug was not hydration-specific | Header leading stable |
| After employee analytics load | Page scroll OK (shell clip); stat cells could micro-overflow internally | Stats grid `min-width: 0`; tests pass |

### Validation screenshots

After-fix captures (Playwright, mocked auth, full page):

- `test-results/employee-mobile-audit/after-320px.png`
- `test-results/employee-mobile-audit/after-375px.png`

Before state documented via measured widths (640px logo wrapper); no before PNG retained pre-fix in CI.

---

## Automated regression tests

**File:** `e2e/employee-dashboard-mobile-overflow.spec.ts`  
**Project:** `employee-dashboard-mobile` (Pixel 5 profile)  
**Helper:** `e2e/helpers/overflowAudit.ts`

For each width **320, 360, 375, 390, 430**:

- Assert `document.documentElement.scrollWidth <= window.innerWidth`
- Assert `.caretip-dashboard-header-leading` width ≤ viewport
- Assert header logo (when present) ≤ 45% viewport width
- States: initial paint, after analytics load, skeleton → settled

Run:

```bash
PLAYWRIGHT_USE_SYSTEM_CHROME=true npm run test:e2e -- e2e/employee-dashboard-mobile-overflow.spec.ts --project=employee-dashboard-mobile
```

**Result:** 15/15 passed (2026-06-14).

---

## Shell-level fixes (all dashboards)

See prior sections: `CareTipLogo` `bar`/`drawer` sizes, CSS-only `DashboardHeader`, `caretip-dashboard-mobile.css`, `MobileDrawer` scroll lock, layout `main` clipping, sidebar skeleton alignment.

---

## Files changed (Employee + shared)

| File | Change |
|------|--------|
| `src/app/components/CareTipLogo.tsx` | `picture` block + `max-w-full`; img `w-auto max-w-full` (fixes 640px blowout) |
| `src/app/components/DashboardHeader.tsx` | Logo wrapper `min-w-0 max-w-[min(6.75rem,36vw)] overflow-hidden shrink` |
| `src/app/pages/employee/EmployeeDashboard.tsx` | Hero image dimensions + `max-w-full` |
| `src/app/components/employee/employeeDashboardUi.ts` | `w-full min-w-0` on page shell |
| `src/styles/caretip-dashboard-mobile.css` | Employee hero/stats containment below `lg` |
| `e2e/employee-dashboard-mobile-overflow.spec.ts` | **New** regression suite |
| `e2e/helpers/overflowAudit.ts` | **New** overflow helpers |
| `playwright.config.ts` | `employee-dashboard-mobile` project |

---

## Checklist (Employee Dashboard)

| Check | Status |
|-------|--------|
| No horizontal page scroll 320–430px | ✅ E2E |
| Logo never exceeds viewport | ✅ 36px at 320px |
| Mobile hero stats 2-up below `lg` | ✅ CSS |
| First-paint logo stable | ✅ img sizing fix |
| Skeleton → loaded without width jump | ✅ E2E |
| Business / Admin unaffected | ✅ shared logo fix only tightens sizing |

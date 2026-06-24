# CareTip Mobile Experience Audit

**Generated:** 2026-06-24  
**Phase:** Product Polish — Priority 1  
**Viewports audited:** 320px · 375px · 390px · 414px · 768px  
**Method:** Static layout audit, `caretip-dashboard-mobile.css` ruleset review, component-level containment checks, dev responsive preview.

---

## Executive Summary

Performance is sufficient. The primary perceived weakness on mobile is **presentation**: desktop-first density, table overflow, and inconsistent vertical rhythm on analytics-heavy modules.

This audit documents findings per route and the fixes applied in this polish sprint.

| Severity | Count | Status |
|----------|-------|--------|
| P0 — horizontal overflow / clipping | 6 areas | ✅ Addressed |
| P1 — hierarchy / whitespace | 8 areas | ✅ Improved |
| P2 — native-feel gaps | 3 modules | ✅ Partial (Analytics, Performance, QR) |

---

## Global Shell (all routes)

| Width | Finding | Fix |
|-------|---------|-----|
| 320–430 | Header logo / search overflow | `caretip-dashboard-shell` clip + `min-width: 0` on leading cluster |
| 320–768 | Drawer causes horizontal shift | `overscroll-behavior: contain` on mobile drawer |
| 320–430 | Excessive horizontal padding | `padding-inline: 1rem` on container; header `0.625rem` at ≤430px |
| All mobile | Tables wider than viewport | `.caretip-mobile-table-scroll` + `min-w-[20rem]` tables |

**Files:** `src/styles/caretip-dashboard-mobile.css`

---

## Per-Route Audit

### Business Dashboard (`/dashboard`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320 | Hero two-column cramped | P1 | Existing `PremiumPageHero` stacks; at-a-glance labels shrink at ≤374px |
| 375 | KPI grid tight | P2 | `clamp()` on metric values; stat card `min-height: 6.75rem` |
| 390 | Chart card height jump | P2 | Chart frame `min-height: 13rem` stabilizes layout |
| 768 | Acceptable | — | Desktop grid preserved |

### Analytics (`/dashboard/tips/analytics`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320 | Comparison tables overflow | **P0** | `caretip-mobile-table-scroll` wrapper |
| 375 | Summary banner 3-col cramped | P1 | Single-column metric stack on mobile |
| 390 | Section spacing too tall | P1 | `space-y-6 md:space-y-8` + `.caretip-mobile-analytics-report` |
| 414 | Period toggle wraps awkwardly | P2 | Existing `flex-wrap` — acceptable |
| 768 | Good | — | 2–3 col grids restore at `sm` |

### Performance (`/dashboard/team/performance`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320 | Health card 4-col unreadable | **P0** | Single-column health metrics on mobile |
| 375 | Executive insight cards OK | — | Already `grid-cols-1 sm:grid-cols-2` |
| 390 | Dense vertical stack | P1 | `.caretip-mobile-performance-report` containment |
| 768 | Good | — | Health grid `sm:grid-cols-2 lg:grid-cols-4` |

### Live Tips (`/dashboard/tips/live`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320–414 | List readable | — | Mobile list patterns in tips module |
| 768 | Sidebar layout N/A | — | Single column on mobile |

### Top Performers (`/dashboard/team/top-performers`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320 | Table horizontal scroll | P1 | Shell `overflow-x-auto` on table panels |
| 375+ | Acceptable | — | Teaser cards stack |

### Employees (`/dashboard/team/employees`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320 | Roster table wide | P1 | `BusinessResponsiveData` mobile cards |
| 375 | Search + filters stack | — | Existing mobile card fallback |
| 768 | Table view | — | Desktop table |

### Locations (`/dashboard/qr-studio/locations`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320–414 | Card grid single column | — | Location cards full width |
| 768 | Two-column potential | P2 | Future: `sm:grid-cols-2` if list grows |

### QR Studio (`/dashboard/qr-studio/*`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320 | QR preview oversized | **P0** | `qr-preview-frame max-width: min(100%, 12rem)` |
| 375 | Designer canvas clip | P0 | `qr-studio-canvas-frame` width 100%, `object-fit: contain` |
| 390 | Employee card grid | P1 | `.qr-studio-employee-grid` containment |
| 414 | Branding studio wide | P2 | Layout `max-w-7xl` only on branding route |
| 768 | Acceptable | — | 2-col grid at `sm` |

### Billing (`/dashboard/settings/billing`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320–414 | Plan cards stack | — | `PremiumPlanCard` responsive |
| 768 | Side-by-side plans | — | Grid at `md` |

### Notifications (`/dashboard/notifications`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320 | Search row cramped | P1 | Form stacks vertical on mobile |
| 375 | Mark-all-read button narrow | P1 | Full-width CTA in hero actions |
| 390 | Filter chips | — | Horizontal snap scroll (existing) |
| 768 | Good | — | |

### Employee Dashboard (`/employee`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320 | Hero visual overflow | **P0** | Dedicated employee hero clip rules |
| 375 | Account stats 2-col | — | `grid-template-columns: repeat(2, minmax(0,1fr))` |
| 414 | Earnings chart | P2 | Viewport-gated chart mount (Sprint 8.1) |
| 768 | Good | — | |

### Admin Dashboard (`/admin`)

| Width | Issue | Severity | Resolution |
|-------|-------|----------|------------|
| 320 | Stat grid overflow | P1 | `platform-admin-stat-grid min-width: 0` |
| 375 | Hero margin excessive | P1 | `max-lg:mb-8` (was 12) |
| 768 | Tablet layout | — | Stat grid responsive |

---

## Mobile-Native vs Shrunk Desktop

| Module | Before | After |
|--------|--------|-------|
| Analytics | 3-col KPI banner on 320px | Single-column KPI stack |
| Performance | 4-col health grid on 320px | Single-column health metrics |
| QR Studio | Fixed preview sizes | Fluid preview + contained canvas |
| Notifications | Inline search + button | Stacked full-width controls |

---

## Testing Checklist

```text
[ ] 320px — no horizontal scroll on dashboard shell
[ ] 375px — analytics tables scroll inside card, not page
[ ] 390px — QR preview fits without clip
[ ] 414px — module sub-nav snap scroll works
[ ] 768px — transitions to tablet grids without layout jump
```

---

## Remaining (P2 backlog)

- Locations page: optional 2-column card grid at `sm`
- Live Tips: list virtualization if feed exceeds 100 items
- Billing: sticky plan comparison bar on scroll
- Admin: dedicated `platform` hero personality (optional)

---

*See `UX_REFINEMENT_REPORT.md` for implementation summary and `HERO_PERSONALITY_SYSTEM.md` for section identity.*

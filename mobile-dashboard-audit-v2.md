# Mobile Dashboard Audit v2

**Date:** 2026-05-29  
**Viewport focus:** 320px–430px (iPhone SE → iPhone Pro Max)  
**Related:** `dashboard-ux-audit.md`, `content-reduction-report.md`

## Method

Reviewed mobile layouts for:

- Stacked text blocks (hero → analytics → cards)
- Horizontal gutters and section rhythm
- Metric card 2-column grids at `max-lg`
- Touch targets (44px minimum on expandable controls)
- Sidebar / drawer nav density

## Global spacing tokens (updated)

| Token | Before | After v2 |
|-------|--------|------------|
| `employeeUi.pageInner` | `pt-5 sm:pt-7` | `px-4 pt-5 sm:px-6 sm:pt-7` |
| `businessUi.pageInner` | `pt-4 max-lg:pt-3.5 sm:pt-7` | `px-4 pt-4 max-lg:pt-4 sm:px-6 sm:pt-7` |
| `employeeUi.section` / `businessUi.section` | `space-y-5 sm:space-y-6` | `space-y-6 sm:space-y-7 lg:space-y-8` |
| `businessUi.statsGrid` gap | `gap-3` | `gap-3.5` |

**Effect:** More breathing room between sections on narrow screens; consistent `16px` side gutters on mobile.

## Per-surface mobile findings

### Business overview (`BusinessDashboard`)

| Item | v1 issue | v2 fix |
|------|----------|--------|
| Hero context bridge | Extra paragraph between pulse metrics and analytics | **Removed** (`helperText` block) |
| Analytics intro | Title + 8-word subtitle stacked | **Title only** |
| Employee goals card | Mobile “How it works” expander + long paragraph | **Removed** expander; pills only |
| Metric grid (2×2) | Cramped with long footer text | Shorter/hidden footers; `gap-3.5` |
| Charts | Title + period description | **Title only** |
| Quick actions | Title + “Common venue tasks” | **Title only** |
| Need help card | Title + 14-word paragraph | **Title + CTA button** |

**Estimated mobile visible words (overview):** ~95 → ~28 (−70%).

### Employee overview (`EmployeeDashboard`)

| Item | v1 issue | v2 fix |
|------|----------|--------|
| Hero bridge | Instructional line under account snapshot | **Removed** |
| Analytics header | Period description under “Period analytics” | **Removed** |
| Earnings chart | Long period description (e.g. “Tips by weekday…”) | **Removed** |
| Recent tips header | Duplicate period line under title | **Removed** |
| Quick actions | “QR and public page” subtitle | **Removed** |

**Estimated mobile visible words (overview):** ~58 → ~14 (−76%).

### Business sub-pages (mobile)

| Page | Change |
|------|--------|
| Locations / Tables | Subtitle hidden — header is single-line title |
| Tips & activity | No subtitle under “Tips & Activity” |
| Staff / QR | Hero description empty — less vertical scroll before content |
| Settings | No subtitle under “Settings” |

### Platform admin (mobile)

| Item | Change |
|------|--------|
| `networkHero.subtitleMobile` | Shortened to “Platform health at a glance.” |
| Drawer nav | Shorter labels reduce truncation on 320px width |
| Tables | No copy change; search-first layout unchanged |

### Mobile navigation

- **Business drawer:** Overview, Team, QR codes, Locations, Tables, Tips, Feedback, Notifications, Support, Settings — no secondary descriptions.
- **Employee drawer:** Overview, Inbox, Tip alerts, Tip goals, Settings — unchanged structure; labels already short.
- **Admin drawer:** “Businesses” / “Transactions” fit without wrapping on 320px.

## Touch & scroll rhythm

| Control | Status |
|---------|--------|
| Period toggle pills | Unchanged; full-width wrap on mobile |
| Expandable dashboard cards (goals, quick actions) | Goals expander text removed; buttons remain ≥44px where present |
| Empty state CTAs | Primary buttons unchanged |
| Inbox list rows | Unchanged |

## Remaining mobile follow-ups (optional)

1. **de.json parity** — German copy not yet shortened to match EN v2.
2. **Business verification pending page** — Still MVP copy blocks (separate from dashboard audit).
3. **Visual QA** — Run Playwright at 375×667 after deploy to confirm no clipped metric values.

## Verification checklist

- [ ] Business overview at 320px: no paragraph between hero and analytics
- [ ] Employee overview at 320px: earnings card shows title only
- [ ] Metric cards: equal height in 2-column grid
- [ ] Side drawers: all labels visible without horizontal scroll

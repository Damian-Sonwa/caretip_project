# Dashboard UX Audit

**Date:** 2026-05-29  
**Scope:** Business, Employee, Platform Admin dashboards (desktop + mobile shells)  
**Principle:** *Favor whitespace over explanation.*

## Executive summary

Dashboard copy and layout were audited for redundant explanations, duplicate instructional text, and visual clutter. Changes focus on **scan-first hierarchy**: number → label → trend (metrics), title-only section headers, and shorter empty states.

| Area | Primary change |
|------|----------------|
| Business overview | Removed hero bridge text, analytics subtitle, chart/goal paragraphs, metric coaching lines |
| Employee overview | Removed hero bridge, earnings chart subtitle, recent-tips period line |
| Platform admin | Shortened hero + table subtitles; tightened nav labels |
| Sub-pages | Dropped empty subtitles (locations, tables, tips, settings, feedback) |
| Navigation | Shorter labels (`Tips`, `Feedback`, `Support`, `Businesses`) |

## Per-page audit

Word counts = **visible user-facing copy** on the page (titles, subtitles, section descriptions, metric footers, empty-state body, banners). Labels on buttons/nav counted once.

| Page | Before (words) | After (words) | Removed | Summarized | Layout improvements |
|------|----------------|---------------|---------|------------|---------------------|
| **Business — Overview** (`/dashboard`) | ~128 | ~28 | ~100 | Hero tagline → removed; analytics desc → title only; metric hints → tip count trend only | Removed context-bridge block; chart CardDescriptions removed; goals “How it works” expander removed; section spacing `space-y-6→8` |
| **Business — Team** (`/dashboard/staff-management`) | ~18 | ~7 | ~11 | Hero desc cleared | Title-only hero via `DashboardHero` |
| **Business — QR codes** (`/dashboard/qr-code-management`) | ~42 | ~6 | ~36 | Section + staff-tags paragraphs cleared | Hero description omitted when empty |
| **Business — Locations** | ~10 | ~2 | ~8 | Subtitle cleared | Subtitle row hidden when empty |
| **Business — Tables** | ~10 | ~2 | ~8 | Subtitle cleared | Subtitle row hidden when empty |
| **Business — Tips & activity** | ~9 | ~3 | ~6 | Subtitle cleared | Header subtitle hidden when empty |
| **Business — Customer feedback** | ~14 | ~4 | ~10 | Page desc cleared | Page desc hidden when empty |
| **Business — Support** | ~22 | ~8 | ~14 | Subtitle → one sentence | — |
| **Business — Settings** | ~16 | ~2 | ~14 | Subtitle cleared | Subtitle hidden when empty |
| **Business — Notifications inbox** | ~14 | ~5 | ~9 | Account subtitle cleared | Inbox subtitle hidden when empty |
| **Employee — Overview** (`/employee/dashboard`) | ~62 | ~14 | ~48 | Hero + analytics bridge removed; earnings desc → title only | Chart/recent-tips/quick-action descriptions removed; mobile gutters `px-4` |
| **Employee — Tip alerts** | ~12 | ~6 | ~6 | `manageHint` cleared | Header description omitted when empty |
| **Employee — Tip goals** | ~14 | ~8 | ~6 | Subtitle cleared; empty state shortened | Header description omitted when empty |
| **Employee — Inbox** | ~14 | ~5 | ~9 | Same as business inbox | — |
| **Platform — Overview** (`/platform-admin/dashboard`) | ~38 | ~14 | ~24 | Hero + analytics subtitles shortened | — |
| **Platform — Business verification** | ~48 | ~10 | ~38 | Long compliance paragraph → one line | — |
| **Platform — Global transactions** | ~22 | ~10 | ~12 | Fee breakdown shortened | — |
| **Platform — User management** | ~38 | ~8 | ~30 | Impersonation instructions → one line | — |
| **Platform — System settings** | ~28 | ~12 | ~16 | Card body shortened | — |
| **Platform — Audit logs** | ~18 | ~18 | 0 | — (count in subtitle retained) | — |
| **Platform — Communication** | ~16 | ~12 | ~4 | Center subtitle tightened | — |

**Totals (audited pages):** ~503 words → ~161 words (**~68% reduction** in explanatory copy).

## Metric cards

| Role | Before | After |
|------|--------|-------|
| Business | 4 cards with coaching/helper footers on every card | Footers show **trend only** (tip count, top-N) or hidden when redundant |
| Employee | Rating count + goal hints always visible | Unchanged structure; hint strings shortened |

Shared component `DashboardMetricStatCard` unchanged — cards reserve footer row but hide transparent placeholder when no trend.

## Navigation cleanup

| Label (EN) | Before | After |
|------------|--------|-------|
| Tips & activity | Tips & activity | **Tips** |
| Customer feedback | Customer feedback | **Feedback** |
| Contact CareTip | Contact CareTip | **Support** |
| Business management (admin) | Business management | **Businesses** |
| Global transactions | Global transactions | **Transactions** |

No descriptions under sidebar items (already icon + label only).

## Empty states (global keys)

| Key | Before | After |
|-----|--------|-------|
| `emptyState.tips` | 15 words | 9 words |
| `emptyState.chart` | 16 words | 11 words |
| `emptyState.activity` | 14 words | 7 words |

Pattern: **headline + one sentence + CTA** (CTA unchanged on pages).

## Files changed

- `src/i18n/locales/en.json` — copy reduction
- `src/app/pages/business/BusinessDashboard.tsx`
- `src/app/pages/employee/EmployeeDashboard.tsx`
- `src/app/components/business/BusinessDashboardMetricsGrid.tsx`
- `src/app/components/business/businessDashboardUi.ts`
- `src/app/components/employee/employeeDashboardUi.ts`
- Sub-pages: `TipsActivityPage`, `LocationsPage`, `TablesPage`, `CustomerFeedbackPage`, `BusinessSettingsPage`, `NotificationInboxFeed`, employee notification/goals headers

## Re-enable / extend

To restore explanatory copy, re-populate the cleared `en.json` keys (search `""` under `business.dashboard`, `business.hero`, `employee.hero`) or re-add removed JSX blocks in dashboard page components.

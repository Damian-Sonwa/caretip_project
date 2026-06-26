# Dashboard Filter UX Audit — Revenue vs QR Analytics Period

**Status:** Implementation complete  
**Date:** 2026-06-24

---

## Executive summary

On **Tips → Analytics** (`/dashboard/tips/analytics`), a single period toggle sat above Revenue Analytics but only QR metrics visibly updated when changed. Revenue appeared frozen because the analytics hook did not refetch when the controlled timeframe changed.

| Check | Result |
|-------|--------|
| Revenue period toggle updates revenue KPIs | PASS |
| QR period toggle positioned above QR section | PASS |
| Controls visually grouped with their content | PASS |
| Independent QR / revenue periods supported | PASS |

---

## Root cause

### 1. Missing timeframe dependency in `useBusinessAnalytics`

**File:** `src/app/hooks/useBusinessAnalytics.ts`

The data-load `useEffect` depended only on `[load]`, not `timeframe`. When `BusinessTipsAnalyticsPage` passed a controlled `timeframe` prop, `timeframeRef` updated on render but **no refetch ran**.

`QrAnalyticsSection` uses `useBusinessQrAnalytics(timeframe)` with `timeframe` in hook deps → QR refetched on every period change.

**User perception:** Toggle above Revenue Analytics → only QR section below animates / updates → control feels miswired.

### 2. Ambiguous layout

**File:** `src/app/components/business/BusinessAnalyticsReporting.tsx`

One global toggle sat between the summary card and both Revenue + QR sections, with no visual grouping to either block.

---

## Fix implemented

### 1. Refetch on timeframe change

```ts
useEffect(() => {
  // ...
  void load({ quiet: true, periodSwitch: true });
}, [load, timeframe]);
```

Revenue bundle (`fetchBusinessAnalyticsBundle`) now reloads when revenue period changes.

### 2. Section-scoped period controls

**Revenue block:**

- Heading: Revenue analytics
- `DashboardAnalyticsPeriodToggle` + Export button
- `RevenueAnalyticsCards` (heading suppressed — parent owns label)

**QR block:**

- Heading: QR analytics
- Independent `DashboardAnalyticsPeriodToggle`
- `QrAnalyticsSection` (heading suppressed)

### 3. Split state on analytics page

**File:** `src/app/pages/business/tips/BusinessTipsAnalyticsPage.tsx`

- `revenueTimeframe` → `useBusinessIntelligenceData`
- `qrTimeframe` → `QrAnalyticsSection` / `useBusinessQrAnalytics`

---

## Components affected

| File | Change |
|------|--------|
| `src/app/hooks/useBusinessAnalytics.ts` | Added `timeframe` to load effect deps |
| `src/app/components/business/BusinessAnalyticsReporting.tsx` | Section-scoped toggles + split props |
| `src/app/pages/business/tips/BusinessTipsAnalyticsPage.tsx` | `revenueTimeframe` + `qrTimeframe` state |
| `src/app/components/business/insights/RevenueAnalyticsCards.tsx` | Optional `showHeading` |
| `src/app/components/business/insights/QrAnalyticsSection.tsx` | Optional `showHeading` |
| `src/i18n/locales/en.json`, `de.json` | `revenuePeriodAria`, `qrPeriodAria` |

**Note:** Main overview dashboard (`/dashboard`) period toggle still controls KPI metrics grid only — unchanged and correct.

---

## Before / after

### Period toggle behavior

| | Before | After |
|---|--------|-------|
| Change to This Week | QR updates; revenue static | Revenue KPIs + charts update |
| QR section | Same toggle as revenue | Own toggle directly above QR |
| Export button | Orphaned with global toggle | Grouped with revenue controls |
| UX clarity | Misleading association | Control directly above affected content |

### Layout

```
Before:
  [Summary]
  [Period toggle + Export]     ← ambiguous
  [Revenue Analytics]
  [QR Analytics]               ← only this reacted

After:
  [Summary]
  [Revenue heading | Period toggle + Export]
  [Revenue KPI cards]
  [QR heading | QR period toggle]
  [QR metrics panel]
```

---

## Verification

| Scenario | Result |
|----------|--------|
| Switch revenue period — KPI cards reload | PASS |
| Switch QR period — scan metrics reload | PASS |
| Independent periods (week revenue / month QR) | PASS |
| Export still downloads transactions | PASS |
| Slow 3G — revenue shows loading state on switch | PASS |
| Mobile layout — toggles wrap cleanly | PASS |

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| Revenue period controls revenue data | Yes |
| QR period control above QR section | Yes |
| No misleading global filter | Yes |
| Filters grouped with content they affect | Yes |

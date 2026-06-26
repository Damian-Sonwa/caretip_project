# QR Analytics Consolidation

**Status:** Implementation complete  
**Date:** 2026-06-24

---

## Executive summary

QR scan analytics appeared in two places: **Tips → Analytics** (reporting module) and **QR Studio → Branding** (performance panel). This duplicated functionality, maintenance, and user trust.

QR Studio is now a **creation and management workspace only**. All QR analytics live under **Tips**.

---

## Problem

| Issue | Impact |
|-------|--------|
| `QrStudioPerformancePanel` on branding page | Extra `getBusinessQrAnalytics` fetch + socket subscription |
| Same metrics in Tips reporting | Users unsure which view is authoritative |
| Split maintenance | Hook/panel changes needed in two surfaces |

---

## Architecture change

### Before

```
QR Studio
├── Employees / Locations / Tables / Templates
└── Branding
    └── QrStudioPerformancePanel  ← duplicate analytics

Tips
└── Analytics
    └── QrAnalyticsSection  ← canonical reporting
```

### After

```
QR Studio (create · customize · brand · generate · print · export)
├── Employees
├── Locations
├── Tables
├── Templates
└── Branding (design only — no analytics)

Tips (reporting)
└── Analytics
    ├── Revenue Analytics + period toggle
    └── QR Analytics + independent period toggle
```

---

## Components removed / consolidated

| Action | File |
|--------|------|
| **Deleted** | `src/app/components/business/QrStudioPerformancePanel.tsx` |
| **Removed usage** | `QrStudioDesigner.tsx` — dropped performance panel footer |
| **Retained (single source of truth)** | `QrAnalyticsSection.tsx` |
| **Retained** | `QrAnalyticsLivePanel.tsx` |
| **Retained** | `useBusinessQrAnalytics.ts` (Tips reporting + BI bundle) |
| **Retained** | `getBusinessQrAnalytics` API + `businessAnalyticsService` bundle |

No reporting-only hooks were deleted — they remain the Tips/BI pipeline.

---

## Information architecture principle

| Module | Responsibility |
|--------|----------------|
| **QR Studio** | Create, customize, brand, generate, print, export |
| **Tips** | Revenue analytics, QR analytics, performance insights, reporting, trends |

QR Studio does **not** own reporting.

---

## Before / after UX

| | Before | After |
|---|--------|-------|
| Branding page scroll | Design tools + scan analytics card | Design tools only |
| Where to see QR scans | QR Studio **or** Tips | **Tips → Analytics** only |
| Network on branding | +1 analytics API + realtime socket | No analytics fetch |
| User mental model | Split | Single reporting home |

---

## i18n note

`business.qrStudio.analytics.*` strings remain in locale files (harmless). Can be removed in a future cleanup pass.

---

## Verification

| Check | Result |
|-------|--------|
| QR Studio branding — no analytics card | PASS |
| Tips → Analytics — QR section present | PASS |
| `QrStudioPerformancePanel` — no imports remain | PASS |
| `npx tsc --noEmit` | PASS |

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| QR Analytics in one place (Tips) | Yes |
| QR Studio focused on management | Yes |
| Duplicate panel removed | Yes |
| Single source of truth for QR metrics | Yes |
| Clean maintainable IA | Yes |

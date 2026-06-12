# Content Reduction Report

**Date:** 2026-05-29  
**Locale:** `src/i18n/locales/en.json` (primary)  
**Goal:** Remove duplicate explanations; keep hospitality-focused scan paths (tips, staff, QR, performance, payouts / earnings, goals, alerts).

## Summary

| Metric | Value |
|--------|-------|
| i18n lines touched | ~85 keys shortened or cleared |
| JSX blocks removed | 12 (hero bridges, CardDescriptions, mobile expanders) |
| Net `en.json` diff | ~72 lines reduced (grep: 179 deletions, 107 insertions) |
| Aggregate visible copy (audited pages) | **~503 → ~161 words (−68%)** |

## Reduction categories

### 1. Removed entirely (UI + copy)

| Location | Text removed |
|----------|----------------|
| `business.hero.helperText` | “Live operational snapshot above…” |
| `employee.hero.helperText` | “Snapshot above. Tap a period below…” |
| `business.hero.sub` | Venue tagline paragraph |
| `employee.hero.sub` | Earnings tagline paragraph |
| `business.dashboard.employeeGoalsDesc*` | Long goal-calculation paragraph + mobile expander |
| Chart `CardDescription` blocks | Daily distribution + staff performance period text |
| `business.dashboard.quickActionsDesc` | “Common venue tasks” |
| `business.dashboard.needHelpDesc` | Long guidelines teaser (title + button remain) |

### 2. Summarized (long → short)

| Key | Before | After |
|-----|--------|-------|
| `business.dashboard.verificationBannerDesc` | 22 words | 10 words |
| `emptyState.tips.description` | 11 words | 7 words |
| `emptyState.chart.description` | 13 words | 9 words |
| `admin.businessVerificationPage.subtitle` | 42 words | 8 words |
| `admin.userManagementPage.subtitle` | 32 words | 6 words |
| `support.business.subtitle` | 22 words | 6 words |
| `business.dashboard.needHelpDesc` | (if shown) 14 → 7 words | Quick tips line |

### 3. Cleared subtitles (hidden in UI when empty)

`business.locationsPage.subtitle`, `business.tablesPage.subtitle`, `business.tipsActivity.subtitle`, `business.settings.subtitle`, `business.customerFeedback.pageDesc`, `business.staffPage.heroDesc`, `business.qrPage.heroDesc*`, `notifications.inbox.subtitle`, `employee.tipGoals.subtitle`, `employee.notifications.manageHint`

### 4. Metric card footers (business)

| Card | Before footer | After footer |
|------|---------------|--------------|
| Total tips | “Live totals update as tips land.” | `{{count}} tips` |
| Active staff | Always “N showing in top list” | “Top N” only when N > 0 |
| Tip count | “Includes successful tips…” | Hidden when active |
| Avg per staff | “Useful coaching metric” | Hidden when active |

## Per-page word ledger

| Page | Before | After | Removed | Summarized |
|------|--------|-------|---------|------------|
| Business overview | 128 | 28 | 95 | 5 |
| Employee overview | 62 | 14 | 45 | 3 |
| Platform overview | 38 | 14 | 20 | 4 |
| Business verification (admin) | 48 | 10 | 38 | 0 |
| QR management | 42 | 6 | 36 | 0 |
| User management (admin) | 38 | 8 | 30 | 0 |
| Staff management | 18 | 7 | 11 | 0 |
| Global transactions | 22 | 10 | 12 | 0 |
| Support (business) | 22 | 8 | 14 | 0 |
| Settings (business) | 16 | 2 | 14 | 0 |
| Tips & activity | 9 | 3 | 6 | 0 |
| Notifications inbox | 14 | 5 | 9 | 0 |
| Locations / Tables | 10 each | 2 each | 8 each | 0 |
| Customer feedback | 14 | 4 | 10 | 0 |
| Employee tip alerts | 12 | 6 | 6 | 0 |
| Employee tip goals | 14 | 8 | 4 | 2 |
| System settings (admin) | 28 | 12 | 16 | 0 |

*Word counts are visible copy estimates for English UI strings.*

## Hospitality focus alignment

| User | Kept prominent | De-emphasized |
|------|----------------|---------------|
| **Manager** | Tip totals, staff count, QR fix prompt, top performers, verification banner | Guidelines wall, goal calculation essay, chart axis descriptions |
| **Employee** | Earnings, recent tips, QR quick action, goal % | Hero taglines, chart period prose |
| **Platform admin** | KYC queue, stat cards, business table | Long compliance intros |

## Not in scope

- Landing/marketing pages (`landing.*`, `staticPages.*`)
- Onboarding wizard copy (`business.onboarding.*`)
- German locale (`de.json`) — update separately for parity
- Auth pages

## How to measure again

```bash
# After changes, spot-check key bundles:
grep -E 'helperText|SectionDesc|heroDesc|subtitle' src/i18n/locales/en.json
```

Restore content by reverting `en.json` dashboard sections or re-adding removed JSX in `BusinessDashboard.tsx` / `EmployeeDashboard.tsx`.

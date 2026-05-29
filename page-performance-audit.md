# CareTip Page-Load Performance Audit

**Date:** 2026-05-28  
**Method:** Static code-path review of route shells, loading gates, API dependencies, and known orchestration patterns. No blanket refactors; classifications are **expected** behavior under normal network/API conditions unless marked **Bug**.

**Legend**

| Rating | Meaning |
|--------|---------|
| **Fast** | Typically &lt;1s perceived (chunk + primary API) |
| **Acceptable** | 1–2s |
| **Slow** | 2–4s (heavy API or sequential work) |
| **Critical** | &gt;4s under normal load |
| **Stuck/Bugged** | Spinner/blank state may not resolve |

---

## Cross-cutting architecture (unchanged — do not rewrite)

| Layer | Behavior |
|-------|----------|
| **Route chunks** | `lazyPages.ts` + `RouteChunkBoundary` → `DashboardOutletFallback` (skeleton spinner in main only; sidebar/header stay mounted). |
| **Auth** | `useRequireAuth` / `useAuth`: `authReady`, `sessionValidated`, `authHydrated` gate API calls. |
| **Business dashboard** | `useBusinessDashboardStats` — staged summary/analytics, session SWR, prefetch (intentional; not modified). |
| **Employee dashboard** | `useEmployeeDashboardAnalytics` — summary + analytics scopes, inflight dedupe on `getTipsByEmployee`. |
| **Notifications (in-app)** | `useNotifications` + `/api/me/notifications`; socket `notification_created` only updates bell/inbox list. |
| **Employee “tip alerts”** | Separate UX: local read-state store + tip list API (not the `notifications` table). |

---

## Priority: Employee Tip Alerts (`/employee/notifications`)

| Attribute | Finding |
|-----------|---------|
| **Rating (before fix)** | **Slow → Stuck/Bugged** (perceived) |
| **Root cause** | Page called `getTipsByEmployee()` with default `scope=full` + `timeframe=today`, which runs the **full employee dashboard bundle** (`loadEmployeeTipsDashboardForTimeframe` + account summary + goals) — same heavy path as the overview chart, not a lightweight alert feed. |
| **Secondary issues** | (1) Loading stayed `true` if `user` was absent when effect ran (blank outlet, no spinner). (2) Errors logged but UI showed **empty state** (“all caught up”) instead of failure. (3) Only **today’s** tips in `full` scope — easy to confuse with “broken” when empty after fast load. |
| **Socket** | `new_tip` listener does **not** block initial render; safe. |
| **API dependencies** | Was: `GET /api/tips/employee?timeframe=today&scope=full` |
| **Fix applied** | Use `GET /api/tips/employee/list?take=100&range=month` (`listEmployeeTips`); gate on `authReady`; error state + retry; auth waiting shows loader. |
| **Rating (after fix)** | **Acceptable** (~0.3–1.2s list API + chunk) |
| **Risk** | Low — endpoint already used by Tips & activity page. |

---

## Employee Inbox (`/employee/inbox`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Acceptable** |
| **API** | `GET /api/me/notifications` via `useNotifications({ loadList: true })`. |
| **Notes** | Same as business/platform inbox; waits for `authReady` on shared `NotificationInboxPage` (see fix below). Socket augments list only. |

---

## Notifications — Business / Platform (`/dashboard/notifications`, `/platform-admin/notifications`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Acceptable** |
| **API** | `GET /api/me/notifications` (+ optional `kind`, `q`, `supportStatus` filters). |
| **Bug (fixed)** | Before `authReady`, hook was inactive but UI could show **empty inbox** (not loading) — looked “broken/empty” during hydration. |
| **Fix applied** | Spinner while `!authReady \|\| initializing`. |
| **Bottleneck** | Re-filter / search triggers list refetch (by design); no socket storm. |

---

## Transactions — Tips & activity (`/dashboard/transactions`, `/employee/transactions`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Acceptable** (refetch on filter change adds ~0.3–0.8s) |
| **API** | `listBusinessTips` / `listEmployeeTips` with pagination (`take=50`). |
| **Bug (fixed)** | `load()` returned early when `!user` without clearing `loading` → perpetual spinner if user slow to hydrate. |
| **Waterfall** | None on first paint; single list call after auth. |

---

## Goals (`/employee/tip-goals`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Fast–Acceptable** |
| **API** | `GET /api/goals` (`listMyGoals`). |
| **Bug (fixed)** | Same auth early-return pattern; added `authReady` gate + loader. |
| **Empty state** | Present with error message on failure. |

---

## Staff Management (`/dashboard/staff-management`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Slow** (first load ~1.5–3s) |
| **API** | `getBusinessStats("all", { scope: "analytics" })` — staff list embedded in analytics payload; plus parallel `fetchLocations` / `fetchTables` for modals. |
| **Loading** | Intentionally holds spinner until `authHydrated && sessionValidated` (avoids flash). |
| **Bug mitigation** | 20s auth hydration timeout clears spinner (rare stuck case). |
| **Socket** | Quiet refresh only; does not block first paint. |
| **Improvement (not done)** | Dedicated lightweight `GET /employees` would reduce payload; higher scope / regression risk. |

---

## Locations (`/dashboard/locations`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Fast** |
| **API** | `GET /api/locations` |
| **Loading** | Resolves in `finally`; empty + toast on error. |

---

## Tables (`/dashboard/tables`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Acceptable** |
| **API** | `Promise.all([fetchLocations(), fetchTables()])` — parallel, not waterfall. |
| **Loading** | Correct empty/error handling. |

---

## Business Overview (`/dashboard`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Acceptable** (by design; staged metrics/charts) |
| **API** | `getBusinessStats` summary + analytics scopes; session cache + prefetch. |
| **Action** | **No change** — orchestration already optimized. |

---

## Business Support (`/dashboard/support`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Fast–Acceptable** |
| **API** | `GET /api/business/support/tickets` |
| **Notes** | Standard CRUD list; no socket. |

---

## QR Code Management (`/dashboard/qr-code-management`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Slow** (large chunk ~420KB + multiple fetches) |
| **API** | Profile, employees, locations, tables (several calls). |
| **Action** | **No change** — chunk weight is main cost; splitting is out of scope. |

---

## Business Settings (`/dashboard/settings`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Acceptable** |
| **API** | Panel-specific (`useBusinessSettingsData`, profile patches). |
| **Notes** | Loads with section; no global stuck spinner. |

---

## Platform Admin

### Overview (`/platform-admin/dashboard`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Slow** first visit (~2–4s) |
| **API** | `fetchPlatformHealth`, `fetchPlatformStats`, `fetchPlatformBusinesses` (deferred), `fetchPlatformAnalytics` (charts). |
| **Design** | `initialDashLoading` only on first full fetch; background sync uses subtle indicators — **healthy**. |
| **Socket** | Metrics refresh only. |

### Businesses / Detail / Verification

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Acceptable–Slow** |
| **API** | List/detail/verify endpoints; table pagination. |
| **Loading** | Standard `loading` + `finally`. |

### Global transactions (`/platform-admin/transactions`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Acceptable** |
| **API** | Platform transactions list. |

### Audit logs / Users / Settings / Announcements

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Fast–Acceptable** |
| **API** | Single list or form per page. |

### My Inbox (`/platform-admin/notifications`)

| Attribute | Finding |
|-----------|---------|
| **Rating** | **Acceptable** (same as business inbox + auth gate fix). |

---

## Employee pages (summary)

| Route | Rating | Primary API(s) |
|-------|--------|----------------|
| `/employee/dashboard` | Acceptable (staged) | `getTipsByEmployee` summary + analytics |
| `/employee/notifications` (Tip alerts) | Acceptable **after fix** | `listEmployeeTips` |
| `/employee/inbox` | Acceptable | `/api/me/notifications` |
| `/employee/tip-goals` | Fast–Acceptable | `/api/goals` |
| `/employee/settings` | Acceptable | `getEmployeeProfile` |
| `/employee/transactions` | Acceptable | `listEmployeeTips` |

---

## Loading-state verification checklist

| Check | Status |
|-------|--------|
| Spinners resolve on success/error | Fixed on Tip alerts, Tips activity, Goals, Staff (timeout), Inbox (auth gate) |
| Empty vs loading vs error distinct | Fixed Tip alerts (error + retry) |
| No duplicate notification systems on Tip alerts | Unchanged (local tip store + list API) |
| Dashboard orchestration untouched | Yes |
| Socket listeners not duplicated per page | Tip alerts: single `new_tip` handler |

---

## Implemented changes (this pass)

1. **`EmployeeNotificationsPage`** — lightweight `listEmployeeTips`; `authReady` gate; error + retry UI.  
2. **`TipsActivityPage`** — clear `loading` when `sessionValidated` but no user.  
3. **`NotificationInboxPage`** — spinner until auth ready (avoid false empty).  
4. **`EmployeeTipGoalsPage`** — auth-ready gate; clear loading when unauthenticated.  
5. **`StaffManagementPage`** — 20s auth hydration safety timeout.  

---

## Recommended follow-ups (not implemented — higher scope)

| Item | Benefit | Risk |
|------|---------|------|
| Dedicated staff list API (decouple from `getBusinessStats` analytics) | Faster Team page | Medium |
| Code-split QR management | Smaller initial chunk | Low–medium |
| Optional `AbortSignal` timeout wrapper for page-level fetches | Fewer “hung” spinners on bad networks | Low |

---

## Validation

- Frontend `npm run build` — run after changes.  
- Manual: open `/employee/notifications` with 0 tips → empty state; with API offline → error + retry; with slow 3G → loader then content &lt;2s typical.  
- Regression: business/employee dashboards, platform admin inbox, sockets unchanged in orchestration layer.

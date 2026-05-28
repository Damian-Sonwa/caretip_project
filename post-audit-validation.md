# CareTip Post-Audit Production Validation Report

**Date:** 2026-05-28  
**Mode:** Validation and documentation only (no code changes in this pass)  
**Reference:** [full-platform-integrity-audit.md](./full-platform-integrity-audit.md)  
**Environment reviewed:** Repository source + local dev patterns; **staging/production databases were not connected** in this pass.

---

## Executive summary

| Verdict | Classification |
|---------|----------------|
| **MVP launch** | **Proceed with light stabilization** — core flows are wired and recent audit fixes address Stripe double-emit, roster cache invalidation, and employee single-request dashboard loading. |
| **Highest remaining risk** | **Goal period math uses UTC** while dashboards use **business IANA timezone** (default `Europe/Berlin`). This is a **trust/data correctness** issue for DE venues, not a crash risk. |
| **Deployment risk** | **`subscription_tier` migration exists in repo but is untracked in git** (`?? backend/prisma/migrations/20260528150000_business_subscription_tier/`). Must be committed and applied on every environment before relying on tier enforcement. |
| **Strategic shift** | Performance/dashboard architecture is in a **freeze window**. Next meaningful MVP perception gain is **Ask CareTip AI quality**, not further dashboard orchestration. |

---

## Validation methodology

This report is based on:

- Static review of routes, services, hooks, Prisma schema, and migrations  
- Alignment with the prior integrity audit and recent optimization commits  
- E2E specs (`e2e/auth-flows.spec.ts`, `e2e/dashboard-instant-metrics.spec.ts`) as **behavior contracts**, not proof of production runs  
- Terminal timing logs from local dev (Supabase pooler, ~1.5–2.5s per employee summary after bundling fix)

**Not performed in this pass:** live clicks through staging/production, load tests, or automated Playwright runs against a running stack.

---

## Per-flow validation matrix

Legend: **PASS** = architecture supports production use; **WARN** = works but known gap; **MANUAL** = requires human verification on deployed env; **FAIL** = production-breaking if unfixed.

| Area | Status | Evidence / notes |
|------|--------|------------------|
| Guest tipping flow | **PASS** / **MANUAL** | QR → staff/table/business landing → amount → Stripe Checkout → rating. Routes: `QRLandingPage`, `StaffLandingPage`, `TableQrLandingPage`, `SelectEmployeePage`, `TipFlowContext`. Repeat-tip stored client-side. |
| Stripe success flow | **PASS** / **MANUAL** | `checkout.session.completed` → `handleSuccessfulTipPayment` creates tip + `emitTipSocket`. `payment_intent.succeeded` → `handlePaymentSuccess` only emits if `updateMany` affects pending rows (idempotent fix). |
| Employee dashboard | **PASS** / **MANUAL** | Single `scope=summary` with `analyticsBundled` + hero fields; serialized `emp-stats-summary`. E2E expects metrics before analytics. |
| Business dashboard | **PASS** / **MANUAL** | Split `summary` / `analytics` scopes; `useBusinessDashboardStats` with SWR, deferral, optimistic period switch. |
| Platform admin dashboard | **PASS** / **MANUAL** | `AdminDashboard` + `platform_metrics_updated` socket refresh. |
| Notifications | **PASS** / **MANUAL** | `useNotifications` + `notification_created`; push via `emitNewTip` → `onTipReceived`. |
| Realtime updates | **PASS** / **MANUAL** | `SocketProvider` ref-count; `new_tip` debounced refresh (~900ms); cache invalidation on tip. |
| Analytics timeframe switching | **PASS** / **MANUAL** | Business: week/month/year + stale-period gating. Employee: today/week/month + in-memory optimistic switch. |
| Goal create/update/delete/archive | **PASS** / **WARN** | CRUD in `goal.service.ts`; cache invalidation added in audit. **WARN:** UTC vs business TZ (see below). |
| Staff invitation flow | **PASS** / **MANUAL** | `employee.service` invite → activation token → `sendEmployeeActivationEmail`. |
| Location management | **PASS** / **MANUAL** | `locations.service`; basic tier capped at 1 location; invalidates stats cache on create. |
| Table QR management | **PASS** / **MANUAL** | `tables.service` + QR slug generation; stats cache invalidation on create. |
| CSV exports | **PASS** / **MANUAL** | `GET /api/transactions/export` + `requireSubscriptionCapability("csvExport")`. |
| Mobile responsiveness | **MANUAL** | Tailwind/`min-h-[100dvh]`, mobile sidebars; no automated visual regression in CI. |
| EN/DE localization | **PASS** / **WARN** | `i18n` en/de JSON; landing hero DE variant. **WARN:** employee today/month chart X-axis may show raw API labels. |

---

## 1. Guest tipping flow

### Expected path

```text
Scan QR → Landing (business / staff / table)
  → Select employee (if needed)
  → Tip amount
  → Stripe Checkout
  → Success → Rating/feedback (session_id)
```

### Code validation

| Step | Implementation | Status |
|------|----------------|--------|
| QR table/staff/business | `getTippingContextByQrSlug`, slug routes in `routes.tsx` | PASS |
| Tip context | `TipFlowContext` persists employee, business, amounts | PASS |
| Payment | `stripe.service` Checkout session; metadata carries `employeeId`, `businessId` | PASS |
| Idempotent tip create | `handleSuccessfulTipPayment` skips if `stripePaymentIntentId` exists | PASS |
| Guest dev bypass | `DEV_BYPASS` on `QRLandingPage` only in dev | PASS |

### Manual QA checklist

- [ ] Scan live staff QR → pay €5 → land on rating page  
- [ ] Scan table QR → correct location/table context in metadata  
- [ ] Cancel payment → no success tip row  
- [ ] Repeat guest sees welcome-back prompt on same business QR  

---

## 2. Stripe success flow

### Webhook handling (`stripe.webhook.ts`)

| Event | Handler | Emit behavior |
|-------|---------|---------------|
| `checkout.session.completed` | `handleSuccessfulTipPayment` | Creates tip (if new PI) → `emitTipSocket` |
| `payment_intent.succeeded` | `handlePaymentSuccess` | Updates pending → emit **only if** `count > 0` |

### Downstream effects of `emitNewTip`

- Socket: `new_tip`, `tip_received` (×2 rooms each)  
- Cache: business tip caches, employee dashboard caches, platform metrics  
- Push: `onTipReceived`  

### Manual QA checklist

- [ ] One Checkout tip → **one** toast/socket update on business + employee dashboards  
- [ ] Webhook retry does not duplicate notifications  
- [ ] `currentMonthTotal` in socket payload matches DB after refresh  

**Status:** **PASS** (post-audit idempotent fix). Confirm on staging with Stripe CLI.

---

## 3. Employee dashboard

### Current architecture (post-optimization)

| Layer | Behavior |
|-------|----------|
| API | Single `GET /api/tips/employee?timeframe=&scope=summary` returns metrics + `chartSeries` + `analyticsBundled: true` + hero balances |
| DB | One serialized bundle: `queryEmployeeDashboardSummaryMetrics` + `queryEmployeeAnalyticsBundle` under `emp-dash-sql` cache |
| UI | `useEmployeeDashboardAnalytics` — summary only on cold load; no parallel `scope=analytics` when bundled |
| Hero | From summary payload (no separate `scope=account` on dashboard mount) |

### Local timing expectation (after fix)

Terminal should show **one** `employee.tips.summary` per period (~1.5–2.5s on Supabase pooler), not paired summary+analytics at ~1.7s each.

### Manual QA checklist

- [ ] Cold load: hero + period metrics + chart appear together after one slow request  
- [ ] Switch today → week → month: cached periods feel instant; uncached ~1–2s  
- [ ] Live tip: KPI updates quickly; chart reconciles after debounced refresh  
- [ ] Error state surfaces if API fails (summary catch sets `error`)  

**Status:** **PASS** architecture; **MANUAL** confirm timings on staging.

---

## 4. Business dashboard

### Architecture

- `getBusinessStats(scope: summary | analytics | full)`  
- `loadBusinessSqlBundleSliceCached` — shared SQL bundle per timeframe  
- `runSerializedByKey` for pool-safe DB access  
- Staged UI: summary first, analytics deferred (rAF + 0ms)  
- Optimistic timeframe switch from in-memory partials  

### Known non-blockers

- Summary scope still computes full bundle server-side (charts not returned in JSON but computed for cache warming)  
- Live `applyLiveTip` does not patch chart buckets until refresh  
- `timeframe=all` chart returns zeros (staff page uses per-employee totals, not chart)  

### Manual QA checklist

- [ ] Month view: metrics appear before chart skeleton clears  
- [ ] Week/year chart labels localized (DE)  
- [ ] Staff change → roster counts refresh without 10-minute stale cache  
- [ ] Pending verification state blocks stats gracefully  

**Status:** **PASS** / **MANUAL**

---

## 5. Platform admin dashboard

- `AdminDashboard` loads platform health, businesses, analytics  
- Socket: `platform_data_updated`, `platform_metrics_updated`  
- Separate from venue dashboards; global tip aggregates  

### Manual QA checklist

- [ ] Admin login → dashboard loads  
- [ ] New tip updates platform metrics (socket or fallback poll)  
- [ ] Business list / verification actions refresh  

**Status:** **PASS** / **MANUAL**

---

## 6. Notifications

| Path | Mechanism |
|------|-----------|
| In-app | `notification_created`, unread count, inbox page |
| Push | Triggered from `emitNewTip` → `notification.triggers` |
| Realtime | `useNotifications` socket listeners with cleanup |

### Manual QA checklist

- [ ] Employee receives in-app notification on tip  
- [ ] Mark read / mark all read  
- [ ] No duplicate notifications per single tip (post-Stripe fix)  

**Status:** **PASS** / **MANUAL**

---

## 7. Realtime updates

| Check | Status |
|-------|--------|
| Single shared socket (`SocketProvider`) | PASS |
| Listener cleanup (`socket.off`) on dashboards | PASS |
| Debounced authoritative refresh after `new_tip` | PASS |
| Disconnect fallback poll (45s) | PASS |
| `business_data_updated` → quiet refresh (business) | PASS |

**Status:** **PASS** / **MANUAL**

---

## 8. Analytics timeframe switching

### Business

- Timeframes: `week`, `month`, `year`  
- Boundaries: `businessUtcRangeForTimeframe` with **Monday-start weeks** in business TZ  

### Employee

- Timeframes: `today`, `week`, `month`  
- Same `businessUtcRangeForTimeframe` for period metrics and charts  

### Manual QA checklist

- [ ] Switch period rapidly — no wrong-period numbers flash (stale-period gating)  
- [ ] Berlin business: “today” resets at local midnight, not UTC midnight  

**Status:** **PASS** for dashboards / **WARN** for goals (below)

---

## 9. Goal create / update / delete

### API surface

- `createMyGoal`, `updateMyGoal`, `archiveMyGoal`, `deleteMyGoalById`  
- Employee summary embeds goal via `resolveGoalForSummaryBundle`  
- Cache invalidation on CRUD (audit fix) + `biz-dash-goals`  

### Critical finding: timezone mismatch (HIGH PRIORITY)

| System | Timezone used |
|--------|----------------|
| Dashboard period totals | **Business IANA** (`Europe/Berlin` default) via `businessUtcRangeForTimeframe` |
| Goal windows (`effectivePeriodBounds`) | **UTC** (`startOfUtcDay`, `startOfUtcWeekMonday`, `startOfUtcMonth`) |
| Business goal list SQL (`listEmployeeGoalsForBusinessImpl`) | **UTC** period starts |
| Goal pacing (`elapsedRatioInPeriod`) | **UTC** |

#### Germany example (Europe/Berlin, UTC+1 / +2 DST)

| Scenario | User expectation | System behavior |
|----------|------------------|-----------------|
| Daily goal, 23:30 Berlin | Still “today” | UTC day may already be next calendar day → wrong window |
| Daily goal midnight Berlin | New day starts | UTC day boundary 1–2h offset → progress jumps early/late |
| Weekly goal Monday 00:00 Berlin | New week | UTC Monday 00:00 UTC ≠ Berlin Monday 00:00 |
| Dashboard “today” tips vs goal progress | Same day | Can disagree near midnight |

**Impact:** Staff and managers may see goal % / `on_track` / `below_target` that do not match period tip cards. **Trust issue**, not a crash.

**Recommendation:** Prioritize aligning `effectivePeriodBounds`, `sumTips`, and business goal SQL with `businessTime.ts` (business timezone on `Business` row). **Do not change in this validation pass.**

**Status:** **WARN** — functional but **not production-accurate** for non-UTC venues.

### Manual QA checklist

- [ ] Create daily goal → progress updates on tips  
- [ ] Edit goal amount → UI reflects after refresh  
- [ ] Archive/delete → goal disappears from dashboard  
- [ ] Compare goal progress vs “today” tip total near midnight Berlin (document discrepancy if seen)  

---

## 10. Staff invitation flow

- Invite creates `EmployeeActivationToken` + email (`sendEmployeeActivationEmail`)  
- Activation routes in auth/onboarding flow  
- Roster changes emit `business_data_updated` + **full** stats cache invalidation (audit fix)  

### Manual QA checklist

- [ ] Invite staff → email received → activation link works  
- [ ] New staff appears on roster / QR management without hard refresh  
- [ ] Slug generation for tipping URL  

**Status:** **PASS** / **MANUAL**

---

## 11. Location management

- List/create locations; basic tier limited to 1 location (`BASIC_MAX_LOCATIONS`)  
- `invalidateBusinessStatsCache` on location create  

### Manual QA checklist

- [ ] Premium: create second location  
- [ ] Basic: blocked with clear message  
- [ ] Location appears in tipping/QR flows  

**Status:** **PASS** / **MANUAL**

---

## 12. Table QR management

- `createTableForBusinessUser`, unique `qrSlug`, links to location  
- Stats cache invalidation on create  
- Print/PDF helpers in frontend (`qrPrintPdf.ts`)  

### Manual QA checklist

- [ ] Create table → QR resolves on scan  
- [ ] Duplicate slug rejected  

**Status:** **PASS** / **MANUAL**

---

## 13. CSV exports

- Route: `transactions.routes.ts` + `requireSubscriptionCapability("csvExport")`  
- UI: `BusinessDashboard`, `TipsActivityPage` gated by `hasCapability("csvExport")`  
- GDPR note: export downloads to user device  

### Manual QA checklist

- [ ] Premium manager can export  
- [ ] Basic tier receives 403 or hidden button  
- [ ] Large tenant export completes (watch timeout)  

**Status:** **PASS** / **MANUAL**

---

## 14. Mobile responsiveness

- Responsive layouts, `AdminMobileSidebar`, employee/business mobile nav patterns  
- Charts: `ResponsiveContainer` (Recharts)  
- Touch targets on tipping flow cards  

### Manual QA checklist

- [ ] iPhone/Android: employee dashboard scroll + period tabs  
- [ ] Tip payment Checkout in mobile browser  
- [ ] Business dashboard charts readable  

**Status:** **MANUAL** only

---

## 15. EN / DE localization

| Area | Coverage |
|------|----------|
| Static pages, auth, dashboards | `en.json` / `de.json` |
| Landing hero | Separate EN/DE images |
| Chart weekdays (business week, employee week) | `chartAxisLabels.ts` |
| Ask CareTip | `locale` passed to API; replies in EN/DE |

### Gaps

- Employee chart **today/month** may use server bucket labels without translation  
- Some toasts differ in richness EN vs DE  

**Status:** **PASS** with minor **WARN**

---

## High-priority verification: subscription migration

### Repository state

| Item | Status |
|------|--------|
| Prisma schema field | `Business.subscriptionTier` → `@map("subscription_tier")` `@default(premium)` |
| Migration SQL | `backend/prisma/migrations/20260528150000_business_subscription_tier/migration.sql` |
| Git tracking | **UNTRACKED** (`??`) at time of validation — **must commit before deploy** |

### Migration SQL (expected)

```sql
CREATE TYPE "BusinessSubscriptionTier" AS ENUM ('basic', 'premium', 'enterprise');
ALTER TABLE "businesses" ADD COLUMN "subscription_tier" "BusinessSubscriptionTier" NOT NULL DEFAULT 'premium';
```

### Per-environment verification (run manually)

```sql
-- Column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'businesses' AND column_name = 'subscription_tier';

-- Enum type exists
SELECT typname FROM pg_type WHERE typname = 'BusinessSubscriptionTier';

-- Existing rows defaulted to premium
SELECT subscription_tier, COUNT(*) FROM businesses GROUP BY subscription_tier;

-- Prisma migration history
SELECT migration_name, finished_at FROM _prisma_migrations
WHERE migration_name LIKE '%subscription_tier%';
```

| Environment | Column exists? | Migration applied? | Notes |
|-------------|----------------|-------------------|--------|
| **Local** | **MANUAL** | **MANUAL** | Run `npx prisma migrate deploy` in `backend/` |
| **Staging** | **MANUAL** | **MANUAL** | Confirm before enabling strict tier UI |
| **Production** | **MANUAL** | **MANUAL** | Default `premium` preserves existing customers |

### Failure modes if migration missing

- Prisma queries selecting `subscriptionTier` → **P2022** / column errors  
- `requireSubscriptionCapability` middleware may 503 or fail open depending on code path  
- Frontend `useSubscriptionEntitlements` fail-opens to **premium** (UI shows features server may deny)

**Status:** **WARN** — **deployment blocker** if migration not applied; **not a runtime bug** once applied.

---

## Post-audit fixes validated (code review)

| Fix | Validated in source |
|-----|---------------------|
| Stripe idempotent emit | `handlePaymentSuccess` returns when `count === 0` |
| Roster cache invalidation | `notifyBusinessRosterChanged` + location/table creates |
| Goal CRUD cache invalidation | `createMyGoal` / `update` / `archive` / `delete` |
| Employee single summary request | Controller + hook bundled path |
| Employee error surfacing | Summary catch sets `error` |

---

## Architecture stabilization phase (recommended freeze)

### Recently completed (do not rewrite)

- Dashboard optimization (business + employee SQL bundles)  
- Instant metrics / optimistic KPI updates  
- Progressive loading + analytics deferral (business)  
- Socket consolidation (`SocketProvider`)  
- Subscription tier groundwork  
- Short-lived cache + serialization for `connection_limit=1`  

### Allow during freeze

- Bug fixes with narrow diffs  
- UX polish (copy, spacing, loading copy)  
- AI improvements (prompts, grounding, fallbacks)  
- Net-new **business features** that do not replace dashboard orchestration  

### Avoid during freeze

- New caching layers or global state systems  
- Re-splitting summary/analytics contracts again  
- New realtime architectures  
- Major dashboard refactors “for performance” without measured regression  

---

## Biggest product opportunity: Ask CareTip AI

### Current implementation (not “dumb FAQ only”)

| Component | Role |
|-----------|------|
| `landingAi.service.ts` | Primary path: **OpenAI** (`LANDING_AI_OPENAI_API_KEY` / `OPENAI_API_KEY`) with FAQ grounding in system prompt |
| `landingAiKnowledge.ts` | FAQ entries + product context + `composeFallbackReply` when LLM unavailable |
| `generateLandingAiReply` | Returns `source: "openai" \| "knowledge"` |

### Perception gap

- When API key is **missing** or OpenAI **errors**, users get **templated FAQ-style** replies (`source: "knowledge"`) — this matches “embedded FAQ” feel.  
- When API key is **present**, experience can be genuinely conversational — but quality depends on prompt, grounding, and hospitality-specific examples.  
- **No in-dashboard AI** for logged-in managers/employees in this validation scope (landing assistant only).

### MVP perception

| Change | User notice |
|--------|-------------|
| Dashboard 2s → 1.5s | Nice |
| Helpful, specific answer to “How do I set up QR for my hotel bar?” | **Memorable** |

### Recommended AI focus (no code in this pass)

1. Ensure `LANDING_AI_OPENAI_API_KEY` set in staging/production  
2. Expand grounding: hospitality scenarios (hotel/bar/restaurant), DE market, CareTip-specific screenshots flows  
3. Log `source` field in analytics to measure OpenAI vs fallback rate  
4. Reduce verbatim FAQ fallback templates; test paraphrase quality in DE  
5. Future: manager-dashboard AI with **read-only** business context (separate feature; not part of freeze violation if scoped)

---

## Production-breaking issues discovered in this pass

**None requiring immediate code change in this validation pass.**

The following are **not** production-breaking (app runs) but **must be tracked**:

1. **Goal UTC vs business timezone** — data trust  
2. **Untracked subscription migration** — deploy process  
3. **Manual E2E not executed** in this pass  

---

## Recommended manual test script (single session, ~45 min)

1. **Stripe:** One real €1 tip on staging → verify single socket toast  
2. **Employee:** Load dashboard → switch today/week/month → one slow load then fast  
3. **Business:** Same + verify staff roster after inviting test employee  
4. **Goals:** Create daily goal, tip, compare progress vs period card near evening Berlin time  
5. **CSV:** Export as premium manager  
6. **AI:** Ask CareTip 3 questions EN + 3 DE; note if replies feel templated  
7. **SQL:** Run subscription column check on staging DB  

---

## Sign-off table

| Role | Question | Answer |
|------|----------|--------|
| Engineering | Safe to ship MVP? | **Yes**, with goal TZ fix scheduled and migration verified |
| Product | Biggest remaining UX risk? | Goal progress vs dashboard near local midnight |
| Ops | Deploy checklist item? | Apply + commit `20260528150000_business_subscription_tier` |
| Leadership | Where to invest next? | **AI quality** over dashboard architecture |

---

*End of post-audit validation report. No application code was modified to produce this document.*

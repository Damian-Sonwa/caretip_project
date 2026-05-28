# CareTip Subscription Readiness Audit

**Audit date:** 2026-05-27 (code-verified)  
**Source matrix:** Basic / Premium feature lists from product packaging  
**Scope:** Readiness for entitlement gating — not billing enforcement

---

## Legend

| Status | Meaning |
|--------|---------|
| **Production ready** | End-to-end works; safe to gate |
| **Partially implemented** | Works with gaps; enforce carefully |
| **UI-only / placeholder** | Not safe to gate as paid feature |
| **Missing** | Not in codebase |
| **Not safe for locking yet** | Gating would break UX or lacks server enforcement |

**Backend enforcement:** `requireSubscriptionCapability`, stats scope checks, location/table/goal limits — present when migration `20260528150000_business_subscription_tier` is applied.

**Default tier for existing venues:** `premium` (no behavior change until tier is set to `basic`).

---

## BASIC PLAN

| # | Feature | Status | Routes / services | Backend enforcement | Frontend UI | Safe to lock | Gaps | Risk |
|---|---------|--------|-------------------|---------------------|-------------|-------------|------|------|
| 1 | QR code tipping | Production ready | Guest flow, Stripe | KYC on manager ops only | Full | Yes | — | Low |
| 2 | Secure Stripe payments | Production ready | `payment.routes`, webhooks | Stripe | Guest UI | Yes | Connect payouts N/A | Low |
| 3 | Employee accounts & invitations | Production ready | `employee.routes`, activation | Auth + email | Staff management | Yes | — | Low |
| 4 | Basic business dashboard | Production ready | `/dashboard`, `GET /api/business/me/stats?scope=summary` | **Yes** (`summary` only) | Full shell | **Yes** | Charts hidden without analytics scope | Low |
| 5 | Employee dashboard | Production ready | `/employee/dashboard`, tips API | **Yes** (`account`/`summary`) | Full | **Yes** | Analytics scope gated | Low |
| 6 | Basic analytics & earnings | Production ready | Stats APIs | **Yes** (summary scopes) | KPIs | **Yes** | — | Low |
| 7 | In-app / email notifications | Production ready | notifications routes, orchestrator | Auth | All roles | Yes | — | Low |
| 8 | Single business location support | Partially implemented | `locations` API | **Yes** (max 1 on `basic` create) | Locations UI | **Yes** with cap | Multi-location = Premium | Medium |
| 9 | Standard QR generation | Production ready | QR management page | Auth | Full | Yes | — | Low |
| 10 | GDPR-ready account tools | Production ready | Employee export/delete | Auth | Settings | Yes | — | Low |
| 11 | English & German support | Production ready | i18n | N/A | All surfaces | Yes | — | Low |

---

## PREMIUM PLAN (incremental over Basic)

| # | Feature | Status | Routes / services | Backend enforcement | Frontend UI | Safe to lock | Gaps | Risk |
|---|---------|--------|-------------------|---------------------|-------------|-------------|------|------|
| 12 | Everything in Basic | — | — | Tier field | — | — | — | — |
| 13 | Real-time dashboards | Production ready | Socket.IO | No tier gate on sockets | Dashboards | Partial | Realtime not tier-gated | Medium |
| 14 | Advanced analytics & charts | Production ready | `scope=analytics\|full` | **Yes** | Charts when entitled | **Yes** | — | Medium |
| 15 | Week / month / year reporting | Production ready | `timeframe` query | **Yes** (via analytics scope) | Selectors | **Yes** | — | Low |
| 16 | Multi-location support | Production ready | `locations` | **Yes** (`multiLocation`) | Full | **Yes** | — | Low |
| 17 | Table QR systems | Production ready | `tables`, tipping-context | **Yes** (`tableQr`) | Full | **Yes** | — | Low |
| 18 | Advanced QR management | Partially implemented | Same as standard QR | Auth | Full | Partial (marketing label only) | Low |
| 19 | Employee goals & performance | Production ready | `goals.routes`, dashboard goals | **Yes** (`employeeGoals`) | Goals UI | **Yes** | Dashboard table may still show goals from stats bundle on basic if analytics loaded elsewhere | Medium |
| 20 | CSV exports & reporting | Production ready | `GET /api/transactions/export` | **Yes** (`csvExport`) | Export buttons | **Yes** | — | Low |
| 21 | Advanced notifications | Partially implemented | Same stack as Basic | No separate channel | Settings | Partial | Marketing differentiation only | Low |
| 22 | Branding & customization | Production ready | Profile logo upload | **Yes** (`brandingCustomization`) | Settings branding | **Yes** | Logo upload blocked on basic | Low |
| 23 | Enhanced operational insights | Partially implemented | `scope=full` stats | **Yes** with premium | Dashboard widgets | **Yes** | Same as advanced analytics | Medium |
| 24 | Faster real-time dashboard experience | Production ready | Staged loading, SWR, socket | No | Dashboards | **Yes** (perf, not tier) | Do not gate socket separately | Low |

---

## Cross-cutting implementation (this pass)

| Item | Detail |
|------|--------|
| `Business.subscriptionTier` | Prisma enum + migration `20260528150000_business_subscription_tier` (default `premium`) |
| `subscriptionCapabilities.ts` | Server capability matrix |
| `requireSubscriptionCapability` middleware | Routes: locations create, tables, goals, CSV export, logo upload, analytics scopes |
| `useSubscriptionEntitlements` | Frontend mirror for nav/chart gating |
| Platform admin | `PATCH /api/platform/businesses/:id/subscription-tier` |
| Client stats cache TTL | 90s result cache; inflight dedupe respects `revalidate` |

---

## Verification (post-implementation)

| Check | Result |
|-------|--------|
| Dashboard load stability | Summary path avoids redundant full reload when partial exists; revalidate busts inflight |
| Socket stability | Unchanged |
| Analytics rendering | Premium/enterprise unchanged; basic skips analytics fetch |
| Duplicate fetch storms | Reduced via inflight dedupe + softer prefetch |
| Employee / admin flows | Unchanged |
| Mobile | No layout changes |
| Localization | No new keys |

---

## Subscription Locking Readiness Summary

### Ready immediately (with migration + default `premium`)

- Guest tipping, Stripe, staff, invitations, basic dashboards (summary), notifications, EN/DE, standard QR, GDPR tools, full Premium surface as currently deployed.

### Needs light polishing

- **Basic tier assignment UI** — use platform admin tier editor; document that `basic` hides analytics/charts in UI.
- **Upgrade CTAs** — link to `/pricing` or contact (no in-app checkout).
- **Goals on basic dashboard** — ensure analytics scope does not include goal table data, or hide goals section when `employeeGoals` is false.

### Not recommended for locking yet

- Real-time socket tiering (product decision).
- “Advanced notifications” as a distinct SKU (not implemented).
- Stripe Billing / automatic tier sync.
- Enterprise-only items (SSO, public API, Connect).

### Recommended MVP gating strategy

1. Apply migration `20260528150000_business_subscription_tier`.
2. Set `basic` only on test venues via platform admin; keep production on `premium`.
3. Enforce server-side first (already in place); add UI gates (partially done).
4. Add Stripe Billing webhook → update `subscription_tier` before UI-only locks on analytics.
5. Phase 2: socket tiering for Basic (poll-only) if product requires it.

---

*Related: `subscription.md` (capability inventory).*
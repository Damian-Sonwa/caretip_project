# CareTip — Application-Wide Subscription & Feature Classification Audit

**Document type:** Internal product capability audit and subscription architecture (not a pricing page).  
**Audit date:** 2026-05-27 (code-verified)  
**Codebase scope:** `src/` (frontend), `backend/src/` (API), `backend/prisma/schema.prisma` (data model).  
**Method:** Static analysis of routes, controllers, services, sockets, and UI modules. Features not found in code are marked **not implemented**, **partially implemented**, or **marketing only**.  
**Enforcement today:** No `plan` / `subscription` fields on `Business` or `User`; no middleware gates by tier — all classifications in §3 and §8 are **recommended packaging**, not runtime behavior.

---

## 1. Executive Summary

### Platform positioning

CareTip is a **hospitality-focused digital tipping platform**: guests pay **one-time tips** via QR codes and staff links; payments run through **Stripe** (Payment Intents / Checkout); funds are attributed to **employees** under a **business (venue)**. The product serves three runtime audiences:

| Audience | Primary surface | Auth |
|----------|-----------------|------|
| **Guest (public)** | QR / slug tipping flow | None |
| **Business manager** | `/dashboard/*` | `MANAGER` + KYC `verified` |
| **Employee** | `/employee/*` | `EMPLOYEE` |
| **Platform operator** | `/platform-admin/*` | `SUPER_ADMIN` + `isPlatformAdmin` |

There is **no SaaS subscription billing engine** in the application today (no Stripe Billing, no plan IDs, no feature flags). The public `/pricing` page describes **per-tip processing fees** and marketing tier names (Starter / Business / Enterprise), not enforced product entitlements.

### Likely customer tiers (recommended)

| Tier | Target customer | Core value |
|------|-----------------|------------|
| **Basic** | Single venue, small team, getting started | QR tipping, staff accounts, essential reporting, email/push alerts |
| **Premium** | Growing venue or multi-site operator | Advanced analytics, realtime dashboards, multi-location/table QR, branding, exports, goals |
| **Enterprise** | Hospitality groups, chains, finance-heavy ops | Org-wide controls, compliance, integrations, custom reporting, dedicated ops (mostly **roadmap** vs. current code) |

### Monetization opportunities

1. **Per-tip processing margin** — Already reflected on `/pricing` (Stripe pass-through + CareTip fee); aligns with actual payment architecture.
2. **Monthly platform fee** — Mentioned in marketing copy for “Business” tier (`29 €/Monat` in `pricingTiers.ts`); **not enforced in app**.
3. **Premium analytics & realtime** — Natural upgrade trigger once gating exists (dashboard `scope=analytics|full`, exports, multi-location).
4. **AI usage billing** — Only **public landing AI** exists today; a **tenant-scoped assistant** would be a new Premium/Enterprise SKU with metered API cost.
5. **Enterprise** — Custom fees, onboarding, SLA, future API/SSO — sales-led; most capabilities require build-out.

### Enterprise differentiators (actual vs. aspirational)

| Differentiator | Status in codebase |
|----------------|-------------------|
| Multi-location & table-level QR | **Implemented** (no tier gate) |
| Manager CSV export | **Implemented** |
| Platform-wide admin & KYC | **Implemented** (internal operator, not customer tier) |
| Audit log API | **Implemented** (platform admin only) |
| Manager impersonation (support) | **Implemented** (platform admin) |
| Public API / webhooks for customers | **Not implemented** |
| SSO / SAML | **Not implemented** |
| White-label / custom domains | **Partially implemented** (branding: logo, slugs, themed employee shell) |
| Stripe Connect per-venue payouts | **Schema field only** (`Business.stripeAccountId` unused in `backend/src`) |

---

## 2. Feature Inventory

Legend: **Cost** = operational cost (Low / Medium / High). **RT** = realtime (Socket.IO). **AI** = external LLM. **DB** = database-heavy.

### 2.1 Authentication & account lifecycle

| Feature | Location / module | Purpose | Dependencies | Cost | RT | AI | Notes |
|---------|-------------------|---------|--------------|------|----|----|-------|
| Email/password registration (business) | `POST /api/auth/register`, `/auth` | Create manager + `Business` | DB, Resend email | Medium | — | — | Role `business` only |
| Email/password registration (employee) | Same + `/join/:code` | Employee signup with invite | DB, email | Medium | — | — | Invite validated via API |
| Google OAuth | `POST /api/auth/oauth` | Sign-in / sign-up | Google, DB | Medium | — | — | |
| Email verification | `GET /api/auth/verify-email` | Gate sign-in quality | DB, email | Low | — | — | |
| Password reset | forgot/reset routes | Account recovery | DB, email | Low | — | — | Rate limited |
| Refresh tokens (httpOnly cookie) | `POST /api/auth/refresh` | Session continuity | DB | Low | — | — | |
| JWT access tokens | `authMiddleware` | API auth | — | Low | — | — | |
| TOTP 2FA setup/enable/disable | `/api/auth/2fa/*` | Account hardening | DB | Low | — | — | **Partially implemented:** not enforced on login in reviewed paths |
| Account deactivation | `User.isActive` | Revoke access | DB | Low | — | — | |
| Preferred locale (en/de) | `User.preferredLocale`, settings | i18n emails/UI | DB | Low | — | — | |
| Employee activation (invite) | `/activate`, activation tokens | Onboard invited staff | DB, email | Medium | — | — | |
| Business onboarding wizard | `/onboarding`, `hasCompletedOnboarding` | Profile before dashboard | DB, upload | Low | — | — | |
| Impersonation (support) | `POST /api/platform/impersonate` | Admin views as manager | JWT, audit | Low | — | — | **Internal only** |

### 2.2 Business verification & compliance (operator-driven)

| Feature | Location | Purpose | Dependencies | Cost | RT | AI | Notes |
|---------|----------|---------|--------------|------|----|----|-------|
| KYC submission (manager) | Business profile, doc upload | Verification queue | Storage, DB | Medium | RT | — | `verificationStatus` |
| KYC approve/reject | Platform `/platform-admin/businesses` | Gate tipping/dashboard | DB | Medium | RT | — | Emits `verification_updated` |
| Pending verification UI | `/verification-pending` | Blocked manager UX | — | — | — | Bypassed when impersonating |
| Audit log (platform API access) | `auditPlatformAccess` + `AuditLog` | Operator traceability | DB | Low | — | — | Every platform API call logged |

### 2.3 Guest tipping (public)

| Feature | Location | Purpose | Dependencies | Cost | RT | AI | Notes |
|---------|----------|---------|--------------|------|----|----|-------|
| Business slug directory | `/:businessSlug`, `QRLandingPage` | Pick staff | DB | Low | — | — | |
| Inline team pool (directory picker) | `QRLandingPage`, `GET /api/staff/directory/business/:slug` | Guest chooses staff from roster on venue page | DB | Low | — | — | Shown when business has active employees |
| Employee public tip URL | `/:businessSlug/:employeeSlug` | Branded tip entry | DB | Low | — | — | |
| QR: business / location / table | `/qr/*`, `/api/tipping-context/*` | Context resolution | DB | Low | — | — | |
| Tip amount selection | `/tip-amount`, `TipFlowContext` | Presets + custom EUR | Client state | Low | — | — | |
| Stripe Checkout session | `POST /api/payments/create-tip-session` | Guest payment | **Stripe**, DB | High | — | — | Core revenue path |
| PaymentIntent (alternate) | `POST /api/tips/create-intent` | Legacy/alternate pay | Stripe, DB | High | — | — | |
| Stripe webhooks | `/api/webhook(s)/stripe` | Confirm/cancel tips | Stripe, DB | High | RT | — | Emits `new_tip` |
| Success page | `/success?session_id=` | Post-payment UX | Stripe session API | Low | — | — | |
| Post-tip feedback | `/rating`, `POST /api/feedback/tip` | Rating/comment | DB, Stripe session | Low | — | — | |
| Repeat tip prompt | Customer flow helpers | Faster re-tip | localStorage | Low | — | — | |
| Tip session context (post-checkout) | `GET /api/payments/tip-session/:sessionId` | Success/rating page data | Stripe + DB | Low | — | — | |

### 2.4 Business manager dashboard

| Feature | Location | Purpose | Dependencies | Cost | RT | AI | Notes |
|---------|----------|---------|--------------|------|----|----|-------|
| Dashboard overview | `/dashboard`, `BusinessDashboard` | KPIs, charts, goals table | `GET /api/business/me/stats` scopes, Recharts | **High** | **Yes** | — | Staged loading summary→analytics |
| Analytics timeframes | week / month / year | Period analysis | DB aggregates, cache ~60s | **High** | — | — | `scope=summary\|analytics\|full` |
| Top performers / goals on dashboard | Business dashboard UI | Team performance | Stats API | Medium | — | — | |
| Staff management | `/dashboard/staff-management` | CRUD, invites, activation | Employee APIs | Medium | **Yes** | — | |
| 6-digit invite codes | `POST /api/business/generate-invite`, `GET /api/business/invite/validate` | Employee join flow | DB | Low | — | — | Used by `/join/:code` |
| Employee slug ensure/regenerate | `POST /api/employees/me/ensure-slug`, manager slug tools | Stable public URLs | DB | Low | — | — | |
| QR management | `/dashboard/qr-code-management` | Generate/export QRs | QR libs, APIs | Medium | — | — | Print/PDF flows |
| Locations | `/dashboard/locations` | Multi-venue | `locations` API | Medium | **Yes** | — | |
| Tables | `/dashboard/tables` | Table QRs | `tables` API | Medium | **Yes** | — | |
| Tips & activity | `/dashboard/transactions` | Ledger, search | `GET /api/tips/business` | Medium | — | — | |
| CSV export (tips) | Dashboard + `GET /api/transactions/export` | Finance reporting | DB read | Medium | — | — | |
| Business settings | `/dashboard/settings?section=` | Profile, team, security, branding | Multiple APIs | Low | — | — | Billing section is **copy/links only** |
| Notifications inbox | `/dashboard/notifications` | In-app messages | Notifications API | Low | **Yes** | — | |
| FCM push (manager) | `useFcmPushSync`, layouts | Mobile alerts | Firebase, FCM | Medium | — | — | Prefs in `UserSettings` |
| Walkthrough demo accounts | `walkthroughDemo.ts`, seed | Sales/demo | Seed data | — | — | — | Not a product tier |

### 2.5 Employee dashboard

| Feature | Location | Purpose | Dependencies | Cost | RT | AI | Notes |
|---------|----------|---------|--------------|------|----|----|-------|
| Earnings overview | `/employee/dashboard` | Hero metrics + chart | `GET /api/tips/employee` scopes | **High** | **Yes** | — | |
| Period analytics | today / week / month | Tip trends | DB, cache | **High** | — | — | |
| Tip notifications feed | `/employee/notifications` | Tip-level alerts | Socket + local store | Medium | **Yes** | — | |
| Tip goals CRUD | `/employee/tip-goals`, `/api/goals` | Personal targets | DB | Low | — | — | |
| Settings / avatar | `/employee/settings` | Profile, push toggle | APIs, upload | Low | — | — | |
| GDPR export | `GET /api/employees/me/export` | Data portability | DB | Medium | — | — | |
| Account delete | `DELETE /api/employees/me` | Erasure | DB cascade | Medium | — | — | |
| Shared tips activity page | `/employee/transactions` | Same component as business | Tips API | Medium | — | — | Not in employee nav |

### 2.6 Platform admin (internal operations — not sold as customer tier)

| Feature | Location | Purpose | Dependencies | Cost | RT | AI | Notes |
|---------|----------|---------|--------------|------|----|----|-------|
| Platform health | `/platform-admin/dashboard` | DB + Stripe status | Health APIs | Low | — | — | |
| Global stats | `GET /api/platform/stats` | Network KPIs | DB aggregates, cache | **High** | **Yes** | — | |
| Platform analytics charts | `GET /api/platform/analytics` | Growth, volume, top venues | **High** DB | **Yes** | — | 60s cache; pool-sensitive |
| Business list & KYC | `/platform-admin/businesses` | Operate tenants | DB | **High** | **Yes** | — | |
| Business detail / delete | `/platform-admin/businesses/:id` | Deep admin | DB | High | — | — | Delete is destructive |
| Global transactions | `/platform-admin/transactions` | Cross-tenant ledger | DB pagination | Medium | — | — | |
| Audit logs viewer | `/platform-admin/logs` | Compliance review | DB | Low | — | — | |
| Announcements broadcast | `/platform-admin/announcements` | in_app + push + email | Orchestrator | Medium | **Yes** | — | Audience filters |
| User management + impersonate | `/platform-admin/users` | Support access | Impersonation JWT | Medium | — | — | |
| Platform notification settings | `/platform-admin/settings` | Admin prefs | Settings API | Low | — | — | Minimal UI |
| **Dead UI (not routed)** | `AdminSettingsPage.tsx`, `AdminUsersPage.tsx` | Mock toggles / mock users | — | — | — | — | **Do not treat as features** |

### 2.7 Notifications & automation

| Feature | Location | Purpose | Dependencies | Cost | RT | AI | Notes |
|---------|----------|---------|--------------|------|----|----|-------|
| In-app notification inbox | All roles, `Notification` model | Persistent inbox | DB | Medium | **Yes** | — | |
| FCM web push | `push/*`, `PushDeviceToken` | Device alerts | Firebase | Medium | — | — | Test route non-prod |
| Email: verification, reset, activation | Resend services | Lifecycle email | Resend | Low | — | — | |
| Email: localized notification templates | `localizedNotificationEmail` | Transactional | Resend | Low | — | — | |
| Login security alert | `onLoginSecurityAlert` | New device sign-in | Email | Low | — | — | |
| Tip received | `onTipReceived` | Staff/manager alert | Push/email/in_app | Medium | **Yes** | — | |
| Employee invited | `onEmployeeInvited` | Invite flow | Email/push | Low | — | — | |
| QR scan / payment success | QR triggers | Engagement signals | Push | Low | — | — | |
| Payout completed | payout triggers | Payout state emails | DB | Low | — | — | **Partially implemented** payout flows |
| Platform operational alert | e.g. verification doc upload | Ops awareness | Email/push | Low | — | — | |

### 2.8 Realtime (Socket.IO)

| Event | Rooms | Trigger | Cost |
|-------|-------|---------|------|
| `new_tip` / `tip_received` | `employee:*`, `business:*` | Successful tip | Medium |
| `business_data_updated` | business + public business | Staff/locations/tables/profile | Low |
| `verification_updated` | business + public | KYC change | Low |
| `platform_*` | `platform` | Admin dashboard refresh | Low |
| `notification_*` | `user:{id}` | Inbox unread counts | Low |
| Public socket join | `public:business:{id}` | Guest pages (optional) | Low |

**Infrastructure note:** Backend uses **single-connection** Prisma pool tuning for Supabase; concurrent dashboard + analytics can cause pool timeouts (documented in recent ops work).

### 2.9 AI & marketing systems

| Feature | Location | Purpose | Dependencies | Cost | RT | AI | Notes |
|---------|----------|---------|--------------|------|----|----|-------|
| Landing “Ask CareTip” assistant | `/`, `POST /api/landing-ai/chat` | Marketing concierge | OpenAI optional, FAQ KB | Medium | — | **Yes** | Public; rate limited |
| Landing AI events | `POST /api/landing-ai/events` | Funnel telemetry | **Console only** | Low | — | — | **Not persisted** |
| Landing AI knowledge base | `landingAiKnowledge.ts` | FAQ grounding | Static | Low | — | — | DE/EN content |
| i18n (EN/DE) | `src/i18n` | Localization | Bundles | Low | — | — | DE lazy-loaded |

### 2.10 Marketing site (public, non-tenant)

| Feature | Route | Notes |
|---------|-------|-------|
| Landing hero + sections | `/` | Product marketing |
| How it works, Features | `/how-it-works`, `/features` | |
| Pricing (fee tiers) | `/pricing` | **Marketing only** — not app entitlements |
| FAQ, Help, Contact, legal | various | Static/i18n |
| PWA install prompt | `App.tsx` | Installable web app |
| Dev hero demos | `/hero-demo`, etc. | Internal/demo |

### 2.11 Integrations

| Integration | Usage | Notes |
|-------------|-------|-------|
| **Stripe** | Guest payments, webhooks, health check | No Connect onboarding in code |
| **Resend** | Transactional email | |
| **Firebase Cloud Messaging** | Web push | Requires env config |
| **Supabase storage** (optional) | Logo/uploads | Falls back per upload service |
| **Google OAuth** | Auth | |
| **OpenAI** | Landing AI only | Env: `OPENAI_API_KEY` / `LANDING_AI_OPENAI_API_KEY` |
| **PostgreSQL** (via Prisma) | All persistent data | Supabase pooler |

### 2.12 Security, health & operational middleware

| Feature | Location | Purpose | Cost | Notes |
|---------|----------|---------|------|-------|
| Auth rate limits | `authLoginLimiter`, forgot/reset limiters | Brute-force mitigation | Low | `rateLimit.middleware.ts` |
| Landing AI rate limits | `landingAiChatLimiter` (30/15min), events limiter | Abuse control | Low | IP-based |
| Push token rate limits | `push.routes.ts` | Token spam control | Low | |
| KYC gate for managers | `isApprovedBusiness.middleware` | Block unverified venues | — | Bypass when `impersonatedBy` set |
| Email verification gate | `requireVerifiedEmail` | API access quality | — | Many manager/employee routes |
| Platform health | `GET /api/platform/health` | DB + Stripe probe | Low | Admin dashboard |
| Image upload diagnostics | `upload.service`, Supabase bucket check | Ops visibility | Low | Local `/uploads` or Supabase |
| Test / dev routes | `/api/test/*` | Local debugging | — | **Not production hardened** |

### 2.13 Hidden / internal automation (not customer tiers)

| System | Location | Purpose | Notes |
|--------|----------|---------|-------|
| Notification orchestrator | `notificationOrchestrator.service.ts` | Fan-out in_app + email + push per event type | Called from `notification.triggers.ts` |
| Tip-received pipeline | `emitTip.ts` → `onTipReceived` | Socket + notifications after webhook | Core realtime path |
| Platform audit on admin API | `auditPlatformAccess` | Auto-write `AuditLog` per platform request | Compliance for operators |
| Platform analytics cache invalidation | `platformAnalytics.service` | Refresh on new tips | DB load control |
| Walkthrough demo seed | `seedWalkthroughDemo.ts`, `walkthroughDemo.ts` | Sales demos | Fixed credentials; not a SKU |
| Short-lived server cache | `shortLivedCache` | Stats/analytics TTL ~60s | Shared across tenants |
| Client SWR cache | `dashboardSwrCache` | Dedupe dashboard fetches | Frontend-only |

### 2.14 Premium-value experiences (guest + operator)

| Experience | Audience | Why it matters commercially |
|------------|----------|----------------------------|
| Frictionless QR → Stripe checkout | Guest | Core conversion / revenue |
| Branded employee tip pages + venue shell | Guest + employee | Perceived quality; Premium branding |
| Live tip toast on employee/manager dashboards | Staff | Emotional “premium” moment; socket-driven |
| Manager operational pulse + top performers | Manager | Retention; natural Premium gate |
| Multi-location / table context on QR | Guest + manager | Operational complexity → Premium |
| Post-tip rating/feedback | Guest + manager | Reputation data; future AI upsell |
| CSV export for finance | Manager | Clear Premium differentiator |
| Platform announcements (broadcast) | All users | Ops tool; could become Enterprise comms channel (future) |

**Duplicate API note:** Employee goals exist on both `GET/PUT/DELETE /api/employees/me/goal` and CRUD under `/api/goals` — UI primarily uses `/api/goals`; treat as one feature family.

---

## 3. Subscription Classification

> **Important:** Classifications below describe **recommended commercial packaging** aligned to today’s build. **Nothing in the runtime enforces these boundaries yet** except business rules (KYC, roles, verification).

### 3.1 BASIC — intended profile

**Customer profile:** Independent venue, café, salon, small restaurant; 1 site; &lt;10–15 staff; finance needs simple totals; getting started with QR tipping.

**Included features (maps to implemented capabilities):**

| Area | Included |
|------|----------|
| Onboarding | Manager signup, email verification, 3-step business onboarding |
| Tipping | Full guest flow (QR, slugs, Stripe checkout), post-tip feedback |
| Staff | Employee invite, activation, staff directory ( **recommend soft cap: 10 staff** — marketing only today) |
| QR | Staff + business QR generation (standard) |
| Locations | **Recommend: 1 location** (code allows unlimited) |
| Tables | **Recommend: not included** or limited (code allows unlimited) |
| Manager dashboard | Summary metrics, **limited analytics** (`scope=summary` + basic month view) |
| Employee app | Personal dashboard, basic period view (today/week), notifications |
| Notifications | Email + in-app; push optional |
| Exports | **Not included** (export exists in code) |
| Branding | Default CareTip branding |
| Language | EN/DE UI |

**Feature limitations (recommended hard/soft limits):**

| Limit | Type | Rationale |
|-------|------|-----------|
| Max staff count | Hard | Matches Starter marketing (10) |
| Max locations | Hard | Premium differentiator |
| Analytics scope | Hard | Gate `scope=analytics\|full` on API |
| History retention | Soft | e.g. 90-day charts (requires backend policy) |
| Realtime refresh | Soft | Slower poll fallback on Basic |
| CSV export | Hard | Premium |

**Upgrade triggers:**

- Needs second location or table QRs → **Premium**
- Needs year-over-year analytics / top performers export → **Premium**
- Needs branded PDF QR packs at scale → **Premium**
- Multi-venue group finance → **Enterprise**

**Scalability assumptions:** Low DB/analytics load per tenant; minimal socket traffic.

---

### 3.2 PREMIUM — intended profile

**Customer profile:** Full-service restaurant, hotel F&B, multi-bar operator; 15–100+ staff; multiple locations; cares about performance management and live operations.

**Included features (everything in Basic, plus):**

| Area | Included |
|------|----------|
| Analytics | Full manager dashboard (`scope=full`), week/month/year, top performers, operational pulse |
| Realtime | Socket-driven dashboard refresh, live tip toasts |
| Locations & tables | Unlimited locations/tables in product |
| QR | Branded exports, print/PDF flows, slug regeneration |
| Staff | Unlimited staff (marketing Business tier) |
| Goals | Employee goal CRUD + manager visibility on dashboard |
| Exports | Manager CSV tip export |
| Notifications | Full push preferences, richer notification types |
| Branding | Logo on profile, employee shell venue branding |
| Settings | Full settings sections including branding |
| Employee analytics | Full employee dashboard scopes (`scope=analytics\|full`) |

**Feature limitations:**

| Limit | Type | Rationale |
|-------|------|-----------|
| Cross-venue rollup | Hard | Single `businessId` tenancy |
| API access | Hard | Enterprise |
| Custom domain | Hard | Enterprise |
| Dedicated support SLA | Soft | Enterprise |
| Landing AI → in-app AI | Soft | Future Premium add-on |

**Upgrade triggers:**

- Multiple legal entities / central procurement → **Enterprise**
- Needs audit exports, SSO, API → **Enterprise**
- Custom tip fee contracts → **Enterprise**

**Scalability assumptions:** Moderate; analytics caches (~60s); socket fan-out per business.

---

### 3.3 ENTERPRISE — intended profile

**Customer profile:** Hotel group, franchise, PE-backed hospitality portfolio; centralized compliance; integrations with PMS/HR/payroll; dedicated success manager.

**Included features (everything in Premium, plus — many require build):**

| Area | Status | Notes |
|------|--------|-------|
| Organization hierarchy (regions, brands) | **Not implemented** | Single business per manager today |
| Centralized admin roles (read-only finance, regional manager) | **Not implemented** | Only `MANAGER` + `EMPLOYEE` |
| SSO / SAML | **Not implemented** | Email/OAuth only |
| Public REST API + webhooks | **Not implemented** | Internal platform API only |
| Custom analytics / BI export | **Partially implemented** | CSV + platform analytics |
| Advanced permissions (RBAC) | **Partially implemented** | Role enum only |
| Compliance pack (audit exports, DPA workflows) | **Partially implemented** | Platform audit logs internal; employee GDPR export |
| White-label (domain, email templates) | **Partially implemented** | Logo/slug theming |
| Stripe Connect per property | **Not implemented** | Schema stub only |
| Dedicated infra / isolation | **Not implemented** | Multi-tenant shared DB |
| SLA + dedicated support | Operational | Sales contract |
| Custom tip fee pricing | **Marketing** | Enterprise pricing page |

**Feature limitations:** Contract-defined.

**Upgrade triggers:** N/A (top tier).

**Scalability assumptions:** Requires connection pooling strategy, read replicas, analytics pre-aggregation, and rate limits on API (future).

#### SSO-ready architecture assessment (current code)

| Area | Readiness | Evidence |
|------|-----------|----------|
| Identity provider abstraction | **Low** | Single `User` table; password + Google OAuth only (`POST /api/auth/oauth`) |
| External IdP token exchange | **Not implemented** | No SAML/OIDC callback routes |
| Session model | **Medium** | JWT access + httpOnly refresh cookie; suitable for SP-initiated SSO **after** IdP handshake issues app JWT |
| Role mapping | **Low** | Hard `Role` enum (`MANAGER`, `EMPLOYEE`, `SUPER_ADMIN`); no SCIM/group sync |
| Multi-tenant org binding | **Low** | One manager ↔ one `businessId`; no org-level IdP tenant ID |
| JIT provisioning | **Partial** | Register/OAuth creates users; no domain-restricted auto-join |
| Admin impersonation | **Implemented** | Separate from SSO; must not conflate with customer SSO |

**Conclusion:** Enterprise SSO is a **greenfield integration** (OIDC recommended first). Existing JWT middleware can remain the app session layer once an IdP callback issues tokens.

---

## 4. AI Capability Audit

### 4.1 Existing AI functionality

| Capability | Scope | Implementation | Production readiness |
|------------|-------|----------------|----------------------|
| Landing concierge chat | **Public marketing** | `landingAi.service.ts` + OpenAI `gpt-4o-mini` (configurable) | **Production** with API key; FAQ fallback without key |
| FAQ grounding / refusal | Public | `landingAiKnowledge.ts` | **Production** |
| Intent events | Public | `landing-ai/events` | **Experimental** (console log only) |
| In-dashboard AI assistant | Tenant | — | **Not implemented** |
| AI tip insights | Tenant | — | **Not implemented** |
| AI admin tools | Internal | — | **Not implemented** |

### 4.2 Weak / FAQ-only areas

- No **tenant-aware** knowledge (policies, house rules, tip pooling rules per venue).
- No **manager/employee copilot** inside `/dashboard` or `/employee`.
- Landing AI **does not** access live tip data (correct for security; limits usefulness for operators).
- **No conversation persistence** or analytics on AI usage for billing.

### 4.3 Opportunities (hospitality-specific)

| Opportunity | Tier fit | Notes |
|-------------|----------|-------|
| Manager “Ask CareTip” (setup, QR placement, labor law disclaimers by country) | Premium | Ground on business profile + docs |
| Shift briefing digest (“yesterday’s tips, top performers”) | Premium | Uses existing stats APIs |
| Review response drafts for `TipFeedback` | Premium | Needs guardrails + PII policy |
| Multilingual guest-facing microcopy (DE/EN/FR) | Premium+ | Extend i18n pattern |
| Anomaly alerts (“tip volume dropped 40%”) | Premium | Batch job on aggregates |
| Enterprise policy Q&A over custom KB per org | Enterprise | Upload PDF policies |

### 4.4 Multilingual potential

- **Implemented:** UI i18n EN/DE; AI can reply in user-selected language on landing chat.
- **Gap:** No Arabic/CJK; no per-venue custom strings; guest tip flow mostly EN/DE via i18n files.

---

## 5. Performance & Infrastructure Considerations

| Category | Examples in CareTip | Concern |
|----------|---------------------|---------|
| **Expensive features** | Platform analytics (`platformAnalytics.service`), business/employee `scope=full` stats, global business list | CPU + DB time; mitigated by ~60s cache |
| **WebSocket-heavy** | Dashboards, verification, announcements | Connection count; debounced refresh |
| **Analytics-heavy** | Recharts + bucketed SQL (`tipChartBuckets.ts`) | Pool saturation on Supabase `connection_limit=1` |
| **DB-intensive** | Tip lists with filters, CSV export, audit log writes | Pagination required; exports unbounded risk |
| **Caching** | `shortLivedCache`, client SWR (`dashboardSwrCache`) | Stale metrics ≤60s acceptable |
| **AI cost** | Landing chat only | Per-request OpenAI; rate limit 30/15min per IP |
| **Stripe** | Checkout + webhooks | Webhook latency affects “realtime” feel |
| **Enterprise scaling** | Many venues × many employees × sockets | Needs read replicas, aggregate tables, queue for notifications |

---

## 6. Recommended Monetization Strategy

### 6.1 Feature gating (recommended implementation order)

1. **API middleware `requirePlan('premium')`** — Not present today; start with analytics scopes + export.
2. **Soft limits** — Staff count, location count (warn then block).
3. **Hard limits** — Block `scope=analytics|full` on Basic API key / JWT claim `plan`.

### 6.2 Soft vs hard limits

| Limit | Basic | Premium |
|-------|-------|---------|
| Staff | Hard at 10 | Unlimited |
| Locations | Hard at 1 | Unlimited |
| Analytics period | Hard: month only | week/month/year |
| Export | Hard: off | on |
| Realtime | Soft: 30s poll fallback | Socket live |

### 6.3 Usage-based pricing

| Meter | Billing unit |
|-------|----------------|
| Successful tips | % + fixed ¢ (already marketed) |
| Active staff/month | Per-seat add-on (optional) |
| Locations | Per-location add-on |
| AI messages | Per 1k messages (future tenant AI) |
| Push notifications | Per 1k sent (optional) |

### 6.4 Enterprise upsell

- Custom processing fees, committed volume
- Implementation/onboarding package
- Future: API calls, SSO, dedicated DB schema, SLA

---

## 7. Technical Risk Notes

| Risk | Severity | Detail |
|------|----------|--------|
| **No plan enforcement** | High commercial | Any customer can use all features if they know URLs |
| **Pricing page ≠ product** | Medium | `PRICING_TIERS` is marketing; Business tier mentions monthly fee not enforced |
| **Stripe Connect unused** | High product | `stripeAccountId` unused; payouts not self-serve Connect |
| **2FA not enforced on login** | Medium | Endpoints exist; bypass possible |
| **Platform analytics pool timeouts** | Medium | Single-connection DB pool; sequentialized queries |
| **Landing AI events not stored** | Low | No product analytics pipeline |
| **AdminSettingsPage / AdminUsersPage** | Low | Dead code; confusing for audits |
| **Payout status flows** | Medium | Enum exists; not full manager UI |
| **Impersonation security** | Medium | Powerful; must stay platform-only + audited |
| **CSV export unbounded** | Medium | Large tenants can time out |
| **Guest payment endpoints public** | High security | Rate limits + Stripe handles fraud; monitor abuse |
| **Enterprise assumptions (API, SSO)** | High | Selling before build = delivery risk |
| **Frontend/backend coupling** | Medium | Stats `scope` contract must stay stable for mobile/web |

---

## 8. Recommended Final Subscription Matrix

### 8.1 Comparison table

| Capability | Basic | Premium | Enterprise |
|------------|:-----:|:-------:|:----------:|
| Guest QR & card tipping | ✅ | ✅ | ✅ |
| Staff accounts | ✅ (cap 10 rec.) | ✅ unlimited | ✅ unlimited |
| Employee mobile dashboard | ✅ basic periods | ✅ full analytics | ✅ full |
| Manager dashboard summary KPIs | ✅ | ✅ | ✅ |
| Manager analytics (week/month/year) | ❌ / month only | ✅ | ✅ |
| Top performers & goals table | ❌ | ✅ | ✅ |
| Multi-location | ❌ (1 rec.) | ✅ | ✅ |
| Table QRs | ❌ | ✅ | ✅ |
| Branded logo & employee theming | ❌ | ✅ | ✅ |
| QR PDF / export packs | ❌ | ✅ | ✅ |
| CSV tip export | ❌ | ✅ | ✅ |
| Realtime socket updates | Limited | ✅ | ✅ |
| Push notifications | ✅ | ✅ | ✅ |
| Email notifications | ✅ | ✅ | ✅ |
| Post-tip guest feedback | ✅ | ✅ | ✅ |
| KYC / verification gate | ✅ | ✅ | ✅ |
| Priority support | ❌ | ✅ (ops) | ✅ dedicated |
| Custom processing fees | Standard | Standard | ✅ custom |
| Public API / webhooks | ❌ | ❌ | ✅ (roadmap) |
| SSO / SAML | ❌ | ❌ | ✅ (roadmap) |
| Org-wide multi-property admin | ❌ | ❌ | ✅ (roadmap) |
| Dedicated infrastructure | ❌ | ❌ | ✅ (roadmap) |
| In-app AI assistant (tenant) | ❌ | 🔜 add-on | ✅ custom KB |
| Landing marketing AI | Public | Public | Public |

✅ = included (recommended) · ❌ = excluded · 🔜 = future

### 8.2 Rationale summary

| Tier | Rationale |
|------|-----------|
| **Basic** | Delivers core tipping loop and minimum operational visibility; caps staff/sites/analytics to protect margin and drive upgrade. |
| **Premium** | Unlocks operational excellence features already built (locations, tables, full analytics, exports, realtime) — highest ROI for gating. |
| **Enterprise** | Mostly **relationship + roadmap**; sell on multi-property control, compliance, integrations, and commercial terms; engineering must catch up. |

### 8.3 Internal capabilities (never customer-facing)

- Platform admin dashboard, global analytics, audit logs, announcements, business deletion, impersonation, Stripe health — **CareTip Operations only**.

---

## Appendix A — API scope reference (enforcement hooks)

Use these existing API parameters when implementing gates:

| Endpoint | Scope parameter | Suggested Basic allowance |
|----------|-----------------|---------------------------|
| `GET /api/business/me/stats` | `summary`, `analytics`, `full` | `summary` only |
| `GET /api/tips/employee` | `account`, `summary`, `analytics`, `full` | `summary` + `account` |
| `GET /api/transactions/export` | — | Premium+ |

---

## Appendix B — Document maintenance

When adding features, update:

1. Section 2 (inventory row)  
2. Section 3 (tier inclusion)  
3. Section 8 (matrix)  
4. Section 7 (risks) if production readiness changes  

**Do not** classify dead/unrouted components (`AdminSettingsPage`, `AdminUsersPage`) as shipped features.

---

## Appendix C — API mount index (discovery map)

| Mount | Router file | Primary consumers |
|-------|-------------|-------------------|
| `/api/auth` | `auth.routes.ts` | All authenticated users |
| `/api/business` | `business.routes.ts` | Managers (profile, KYC docs, invite) |
| `/api/business/me/stats` | `business.controller` (app-level) | Manager dashboard |
| `/api/employees` | `employee.routes.ts` | Managers + employees |
| `/api/staff` | `staff.routes.ts` | Public directory + slug lookup |
| `/api/tips` | `tips.routes.ts` | Employee/manager tip feeds, PaymentIntent |
| `/api/transactions` | `transactions.routes.ts` | CSV export |
| `/api/goals` | `goals.routes.ts` | Employee goals |
| `/api/locations`, `/api/tables` | respective routes | Manager multi-site |
| `/api/tipping-context` | `tippingContext.routes.ts` | Guest QR resolution |
| `/api/payments` | `payment.routes.ts` | Guest Stripe Checkout |
| `/api/webhook(s)/stripe` | `stripe.webhook.ts` | Stripe |
| `/api/feedback` | `feedback.routes.ts` | Post-tip rating |
| `/api/me`, `/api/me/notifications` | settings, notifications | All roles |
| `/api/push` | `push.routes.ts` | FCM registration |
| `/api/platform`, `/api/admin` | `platform.routes.ts` | `SUPER_ADMIN` only (same router) |
| `/api/landing-ai` | `landingAi.routes.ts` | Public marketing |
| `/api/test` | `test.routes.ts` | Dev only |

Frontend route source of truth: `src/app/routes.tsx` + `src/app/routing/lazyPages.ts`.

---

*End of audit.*

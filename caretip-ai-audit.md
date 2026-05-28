# CareTip AI Assistant — Audit & Intelligence Verification

**Date:** 2026-05-28  
**Scope:** Ask CareTip landing assistant only (`/api/landing-ai/*`, `landingAi.*`, frontend widget).  
**Out of scope:** Dashboards, payments, subscriptions, analytics bundles, sockets, onboarding flows.

---

## Executive summary

| Item | Finding |
|------|---------|
| **Root cause** | OpenAI **is configured and called**, but this environment returns **HTTP 429 (quota exceeded)**. Failures fall back to `composeFallbackReply`, which previously behaved like a **FAQ lookup bot** due to weak keyword routing. |
| **“FAQ feel” with keys set”** | Not a missing key issue; it is **silent degradation** on OpenAI errors plus fallback copy that echoed FAQ snippets. |
| **Intelligence score (this env)** | **0 / 100** with quota blocked (0/11 OpenAI replies). **Expected ~75–85 / 100** once quota is restored and `gpt-4o-mini` (or similar) is used. |
| **OpenAI verification** | **Reachable** — requests hit `https://api.openai.com/v1/chat/completions`; not a wiring bug. |
| **Fixes applied** | Advisory knowledge, better FAQ ranking, clearer fallback reasons, prompt grounding for strategy questions, dev/ops logging, audit harness. |

---

## 1. OpenAI configuration

### Environment variables

| Variable | Purpose | Local audit (2026-05-28) |
|----------|---------|----------------------------|
| `LANDING_AI_OPENAI_API_KEY` | Preferred dedicated key for landing chat | **Not set** |
| `OPENAI_API_KEY` | Shared fallback | **Set** |
| `LANDING_AI_OPENAI_MODEL` / `OPENAI_MODEL` | Model id | **`gpt-5-mini`** (from `.env`) |
| `LANDING_AI_OPENAI_BASE_URL` / `OPENAI_BASE_URL` | API base | Default `https://api.openai.com/v1` |

Resolution order in `landingAi.service.ts`:

1. `LANDING_AI_OPENAI_API_KEY` → else `OPENAI_API_KEY`
2. Model: `LANDING_AI_OPENAI_MODEL` → `OPENAI_MODEL` → default **`gpt-4o-mini`**
3. Base URL: landing-specific → shared → OpenAI v1

### Environment loading

- `backend/src/index.ts` imports `dotenv/config` then `./loadEnv.js`.
- `loadEnv.ts` merges **repo root `.env`** then **`backend/.env`** (backend wins).
- Same pattern as other secrets; no separate production loader for landing AI.

### Production vs development

- No branch that disables OpenAI in production.
- If the key is absent → `fallbackReason: "no_api_key"`.
- If OpenAI returns non-2xx → `fallbackReason: "openai_http_error"` (logged, not shown to guests except optional dev console).

### Silent fallback?

**Before audit:** OpenAI errors logged as `[landing-ai] OpenAI error {status}` but the API only returned `source: "knowledge"` with no reason; the UI ignored `source`.

**After fixes:** Response includes `fallbackReason`; dev console logs `{ source, fallbackReason }`; server logs in non-production.

### API actually reaches OpenAI?

**Yes.** Probe and chat runs received **HTTP 429** with body:

`You exceeded your current quota, please check your plan and billing details.`

That confirms DNS, auth header, and request shape are valid. The assistant was **not** skipping the API when a key exists.

### Operational recommendation

1. Restore OpenAI billing quota or use a funded key.
2. Set **`LANDING_AI_OPENAI_API_KEY`** in production (isolate landing traffic).
3. Prefer **`LANDING_AI_OPENAI_MODEL=gpt-4o-mini`** unless you explicitly need another chat-completions model your key supports.
4. Run `npm run audit:landing-ai` after deploy to confirm `reachable: true` and `OpenAI replies: N/11` with N > 0.

---

## 2. Request flow (end-to-end)

```
Landing page
  └─ LandingOnboardingAssistantHost (intent / launcher)
       └─ LandingOnboardingAssistant.tsx
            ├─ Suggested chips → promptId (FAQ ids: how_it_works, setup_time, …)
            ├─ Typed input → messages[]
            └─ postLandingAiChat()  [src/app/lib/landingAiApi.ts]
                 POST /api/landing-ai/chat  { messages, promptId?, locale }

backend/src/routes/landingAi.routes.ts
  └─ landingAiChatLimiter (30 req / 15 min / IP)
       └─ landingAi.controller.landingAiChat
            └─ validateChatBody()
            └─ generateLandingAiReply()  [landingAi.service.ts]
                 ├─ isLikelyOffTopic? → scope refusal (knowledge)
                 ├─ rankFaqEntries() → buildFaqGroundingBlock()
                 ├─ callOpenAi() → chat/completions
                 │     system: ASSISTANT_ROLE + CARETIP_PRODUCT_CONTEXT + FAQ snippets
                 │     user/assistant history (max 12 turns)
                 └─ on failure → composeFallbackReply()
            └─ JSON { reply, source, fallbackReason }

Frontend
  └─ Renders reply bubble (no source shown in UI)
  └─ DEV: console.info [Ask CareTip] { source, fallbackReason }
  └─ Analytics: question_asked meta includes aiSource, fallbackReason
```

### Where intelligence was lost

| Step | Issue |
|------|--------|
| **OpenAI call** | 429 quota → treated same as “no AI” |
| **Fallback composer** | Picked wrong FAQ via keyword (`how` → `how_it_works`) for strategic questions |
| **Suggested prompts** | Map 1:1 to FAQ ids (+120 score) → model heavily anchored to one snippet |
| **System prompt** | Large FAQ block; without a live model, users only see fallback |
| **Frontend** | Discarded `source`; no visibility into fallback vs OpenAI |

---

## 3. Fallback analysis

| Path | When | `source` | `fallbackReason` |
|------|------|----------|------------------|
| OpenAI success | 2xx + non-empty content | `openai` | `null` |
| Off-topic guard | Regex (code, weather, etc.) | `knowledge` | `off_topic` |
| No API key | Both keys empty | `knowledge` | `no_api_key` |
| OpenAI HTTP error | 401, 429, 5xx, timeout | `knowledge` | `openai_http_error` |
| Empty model output | 2xx but no content | `knowledge` | `openai_empty` |

Fallback text is **retrieved + lightly templated** (`composeFallbackReply`), not LLM-generated.

**Important:** FAQ snippets in the OpenAI path are **context only**; the model is instructed to paraphrase. When OpenAI is down, fallbacks are **expected** to feel simpler; improvements target **topic-aware** summaries, not fake LLM tone.

---

## 4. Prompt quality assessment

**Strengths (existing + updated):**

- Clear AI-first instructions, safety rules, no invented balances.
- Full product context block (`CARETIP_PRODUCT_CONTEXT`).
- EN/DE via `Respond in {German|English}`.
- Temperature ~0.62, max_tokens 520, conversation history supported.

**Weaknesses (addressed in this pass):**

- Strategy questions could collapse to generic “how CareTip works” when FAQ ranking misfired.
- FAQ grounding could dominate short answers on chip prompts.

**Updates applied:**

- Explicit instruction to **synthesize** for growth/KPI/motivation/compare questions.
- Expanded **hospitality advisory** section in product context.
- Seven new FAQ grounding entries: `grow_tips`, `kpis`, `onboard_staff`, `vs_cash`, `hotel_pitch`, `motivation`, `guest_experience`.
- Scoring tweaks: deprioritize `how_it_works` and `employee_tips` for advisory queries.

**Score:** Prompt design **B+** when OpenAI is live; fallback path **C → B-** after knowledge/ranking fixes.

---

## 5. Knowledge base audit

| Check | Status |
|-------|--------|
| FAQ used as context for OpenAI | Yes — `buildFaqGroundingBlock`, top 4 ranked entries |
| FAQ replaces reasoning when OpenAI works | No — by design; failure mode only when API fails |
| FAQ verbatim in OpenAI path | Discouraged in system prompt; not enforced in code |
| Answer beyond exact FAQ match | Yes **if** OpenAI returns; product + advisory context allow synthesis |
| Weak keyword → wrong FAQ on fallback | **Was yes** — mitigated with new entries + scoring |

`getKnowledgeReply()` is only used inside fallback when **no** ranked entries match.

---

## 6. Intelligence test suite

**Harness:** `npm run audit:landing-ai` (`backend/src/scripts/auditLandingAi.ts`)

### Environment at test time

- `OPENAI_API_KEY`: set  
- `LANDING_AI_OPENAI_API_KEY`: not set  
- Model: `gpt-5-mini`  
- OpenAI probe: **429 quota**  
- Result: **0/11** `source=openai`

### Scenario results (after fixes, quota still blocked)

| Category | Question | Fallback | Classification | Notes |
|----------|----------|----------|----------------|-------|
| Business | How can I increase tips? | `openai_http_error` | faq_only | Now routes to **`grow_tips`** snippet (not generic how_it_works) |
| Business | Why are tips lower this week? | `openai_http_error` | faq_only | **`grow_tips`** |
| Business | How should I onboard my staff? | `openai_http_error` | faq_only | **`onboard_staff`** |
| Business | Benefits of QR tipping? | `openai_http_error` | faq_only | **`qr_customize`** + secondary |
| Business | CareTip improve service? | `openai_http_error` | faq_only | **`guest_experience`** |
| Product | Explain to hotel manager | `openai_http_error` | faq_only | **`hotel_pitch`** |
| Product | Compare vs cash tipping | `openai_http_error` | faq_only | **`vs_cash`** |
| Product | What KPIs to monitor? | `openai_http_error` | faq_only | **`kpis`** |
| Reasoning | Hotel growth | `openai_http_error` | faq_only | **`hotel_pitch`** |
| Reasoning | Employee motivation | `openai_http_error` | faq_only | Improved routing toward **`motivation`** |
| Reasoning | Guest experience | `openai_http_error` | faq_only | **`guest_experience`** |

### Expected with healthy OpenAI (not run here — quota)

| Classification | Expected share |
|----------------|----------------|
| Fully generated & contextual | ~80–90% of typed strategic questions |
| Partially intelligent (grounded paraphrase) | Chip prompts / narrow FAQ-aligned asks |
| FAQ only | Off-topic refusal; outage fallback |

### Before / after fallback example

**Question:** “How can I increase tips?”

**Before (quota fallback):**

> Here's how I'd put it: CareTip lets guests tip in seconds by scanning a branded QR code…

**After (quota fallback):**

> Here's how I'd put it: Many venues lift tip volume by placing branded QR codes where service ends… (AI reply temporarily unavailable, here is a concise CareTip summary.)

**After (with OpenAI — illustrative):** Model should combine hospitality tactics (placement, staff mention, shift review) with CareTip dashboards/goals, not repeat the generic platform blurb.

---

## 7. Fixes applied (this pass)

| Area | Change |
|------|--------|
| `landingAiKnowledge.ts` | Advisory product context; 7 FAQ entries; ranking fixes; outage note in fallback |
| `landingAi.service.ts` | `fallbackReason`; config resolver; improved prompts; temperature 0.62 |
| `landingAi.controller.ts` | Return `fallbackReason`; dev logging |
| `landingAiApi.ts` / widget | Surface `fallbackReason` in DEV + analytics meta |
| `.env.example` | Document quota fallback, model guidance |
| `auditLandingAi.ts` | `npm run audit:landing-ai` harness |

**Not changed:** Rate limits, auth model, route paths, dashboard code, payment/subscription stacks.

---

## 8. Final recommendation

### To feel like a genuine AI assistant

1. **Fix OpenAI quota** on the configured key (current blocker for all “intelligence”).
2. Use **`gpt-4o-mini`** (or your chosen supported chat model) via `LANDING_AI_OPENAI_MODEL`.
3. Set **`LANDING_AI_OPENAI_API_KEY`** in production.
4. Monitor `fallbackReason` in logs/analytics; alert if `openai_http_error` rate > 5%.
5. Re-run `npm run audit:landing-ai` until summary shows **OpenAI replies ≥ 9/11**.

### Product UX (optional later, out of this pass)

- Show a subtle “AI” vs “Help article” indicator when `source === "knowledge"` and `fallbackReason === "openai_http_error"`.
- Add 1–2 suggested chips for growth/KPIs (not only FAQ ids).

### Success criteria met?

| Criterion | Status |
|-----------|--------|
| Architecture preserved | Yes |
| Root cause identified | Yes — quota + fallback UX |
| OpenAI path verified | Yes — reaches API |
| Grounding improved | Yes |
| Verification harness | Yes — `audit:landing-ai` |
| Genuine AI feel in production | **Blocked on billing** until quota restored |

---

## Appendix: Quick verification commands

```bash
cd backend
npm run audit:landing-ai
# Expect: reachable: true, OpenAI replies > 0 when quota OK

# Dev chat — watch server log:
# [landing-ai:chat] { source: 'openai', fallbackReason: 'none' }
```

Browser (Vite dev): open landing → Ask CareTip → ask a question → DevTools console:

`[Ask CareTip] { source: 'openai', fallbackReason: 'none' }`

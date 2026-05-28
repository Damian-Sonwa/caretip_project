import {
  buildFaqGroundingBlock,
  CARETIP_PRODUCT_CONTEXT,
  composeFallbackReply,
  isLikelyOffTopic,
  LANDING_AI_SCOPE_REFUSAL,
  rankFaqEntries,
} from "./landingAiKnowledge.js";

export type LandingChatMessage = { role: "user" | "assistant"; content: string };

const ASSISTANT_ROLE = `You are Ask CareTip: a knowledgeable, conversational product guide on the marketing website.
You help hospitality operators and curious visitors understand CareTip and move toward signup when it fits naturally.

RESPONSE MODEL (AI-first):
- Reason from product context and FAQ reference snippets below. FAQ snippets are hints, not scripts.
- For strategy questions (growth, KPIs, motivation, comparisons), synthesize hospitality advice AND tie relevant CareTip capabilities. Do not default to a generic product overview.
- Paraphrase in your own words. Do NOT paste FAQ text verbatim or repeat the same template every turn.
- Use the conversation history for follow-ups (pronouns, "that", "also", comparisons).
- Ask one short clarifying question when the user's goal is ambiguous.
- Be warm, intelligent, and concise: usually 2 to 5 sentences. No bullet walls unless the user asked for a list.

SCOPE:
- CareTip product, onboarding, QR tipping, dashboards, payouts, pricing (high level), security/GDPR, employee and business workflows.
- Politely decline unrelated topics (general knowledge, code, medical/legal advice) in one sentence and invite a CareTip question.

SAFETY (strict):
- NEVER invent account balances, payout amounts, verification status, or claim a specific payment succeeded.
- NEVER promise features not described in the product context.
- For exact fees or tiers, point to the Pricing page rather than guessing numbers.
- For account-specific issues, suggest Help Center, FAQs, or contacting support.

STYLE:
- Premium SaaS tone, natural spoken English/German as requested.
- Use periods and commas only. Do not use em dashes or en dashes.
- Vary openings; avoid robotic phrases like "Certainly!" or "I'd be happy to help with that request."
- End with a soft CTA only when natural (signup, pricing, FAQ).`;

/** Strip em/en dashes from assistant copy for a cleaner chat UI. */
export function polishLandingAiReply(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*\./g, ".")
    .trim();
}

const MAX_USER_LEN = 600;
const MAX_HISTORY = 12;
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export type LandingAiFallbackReason =
  | "off_topic"
  | "no_api_key"
  | "openai_http_error"
  | "openai_empty"
  | null;

function resolveOpenAiConfig(): { apiKey: string; model: string; base: string } | null {
  const apiKey =
    process.env.LANDING_AI_OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const model =
    process.env.LANDING_AI_OPENAI_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    DEFAULT_OPENAI_MODEL;
  const base = (
    process.env.LANDING_AI_OPENAI_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    "https://api.openai.com/v1"
  ).replace(/\/+$/, "");
  return { apiKey, model, base };
}

function buildSystem(locale: string, faqGrounding: string, promptId?: string): string {
  const lang = locale.toLowerCase().startsWith("de") ? "German" : "English";
  const promptHint = promptId
    ? `\nThe user may have tapped a suggested topic related to: ${promptId}. Address that topic naturally while staying conversational.`
    : "";

  return `${ASSISTANT_ROLE}

## Product context
${CARETIP_PRODUCT_CONTEXT}

## FAQ reference (ground truth — paraphrase, do not copy verbatim)
${faqGrounding}
${promptHint}

Respond in ${lang}.`;
}

export function validateChatBody(body: unknown): {
  messages: LandingChatMessage[];
  promptId?: string;
  locale: string;
} | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid body" };
  const o = body as Record<string, unknown>;
  const locale = typeof o.locale === "string" && o.locale.trim() ? o.locale.trim().slice(0, 12) : "en";
  const promptId = typeof o.promptId === "string" ? o.promptId.trim().slice(0, 64) : undefined;
  const raw = o.messages;
  if (!Array.isArray(raw) || raw.length === 0) return { error: "messages required" };
  const messages: LandingChatMessage[] = [];
  for (const item of raw.slice(-MAX_HISTORY)) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: string }).role;
    const content = (item as { content?: string }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const trimmed = content.trim().slice(0, role === "user" ? MAX_USER_LEN : 2000);
    if (!trimmed) continue;
    messages.push({ role, content: trimmed });
  }
  if (messages.length === 0) return { error: "messages required" };
  const last = messages[messages.length - 1];
  if (last.role !== "user") return { error: "Last message must be from user" };
  return { messages, promptId, locale };
}

async function callOpenAi(
  messages: LandingChatMessage[],
  locale: string,
  faqGrounding: string,
  promptId?: string,
): Promise<{ text: string | null; httpStatus?: number }> {
  const cfg = resolveOpenAiConfig();
  if (!cfg) return { text: null };

  const payload = {
    model: cfg.model,
    temperature: 0.62,
    max_tokens: 520,
    messages: [
      { role: "system", content: buildSystem(locale, faqGrounding, promptId) },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };

  const res = await fetch(`${cfg.base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[landing-ai] OpenAI error", res.status, cfg.model, text.slice(0, 200));
    return { text: null, httpStatus: res.status };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const reply = data.choices?.[0]?.message?.content?.trim();
  return { text: reply || null, httpStatus: res.status };
}

export async function generateLandingAiReply(input: {
  messages: LandingChatMessage[];
  promptId?: string;
  locale: string;
}): Promise<{
  reply: string;
  source: "openai" | "knowledge";
  fallbackReason: LandingAiFallbackReason;
}> {
  const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content ?? "";

  if (isLikelyOffTopic(userText)) {
    return {
      reply: polishLandingAiReply(LANDING_AI_SCOPE_REFUSAL),
      source: "knowledge",
      fallbackReason: "off_topic",
    };
  }

  const faqEntries = rankFaqEntries(userText, input.promptId, 4);
  const faqGrounding = buildFaqGroundingBlock(faqEntries, input.locale);

  if (!resolveOpenAiConfig()) {
    const reply = composeFallbackReply({
      userText,
      locale: input.locale,
      promptId: input.promptId,
    });
    if (process.env.NODE_ENV !== "production") {
      console.info("[landing-ai] fallback=no_api_key");
    }
    return {
      reply: polishLandingAiReply(reply),
      source: "knowledge",
      fallbackReason: "no_api_key",
    };
  }

  const llm = await callOpenAi(input.messages, input.locale, faqGrounding, input.promptId);
  if (llm.text) {
    return {
      reply: polishLandingAiReply(llm.text),
      source: "openai",
      fallbackReason: null,
    };
  }

  const reply = composeFallbackReply({
    userText,
    locale: input.locale,
    promptId: input.promptId,
  });
  const fallbackReason: LandingAiFallbackReason = llm.httpStatus
    ? "openai_http_error"
    : "openai_empty";
  if (process.env.NODE_ENV !== "production") {
    console.info("[landing-ai] fallback=", fallbackReason, "http=", llm.httpStatus ?? "n/a");
  }
  return { reply: polishLandingAiReply(reply), source: "knowledge", fallbackReason };
}

/** Startup-safe check for ops dashboards (no secrets). */
export function getLandingAiConfigStatus(): {
  openAiConfigured: boolean;
  model: string;
  keySource: "landing" | "shared" | "none";
} {
  const landing = !!process.env.LANDING_AI_OPENAI_API_KEY?.trim();
  const shared = !!process.env.OPENAI_API_KEY?.trim();
  const cfg = resolveOpenAiConfig();
  return {
    openAiConfigured: !!cfg,
    model: cfg?.model ?? DEFAULT_OPENAI_MODEL,
    keySource: landing ? "landing" : shared ? "shared" : "none",
  };
}

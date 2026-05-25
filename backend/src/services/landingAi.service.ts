import {
  getKnowledgeReply,
  isLikelyOffTopic,
  LANDING_AI_SCOPE_REFUSAL,
} from "./landingAiKnowledge.js";

export type LandingChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are CareTip's premium onboarding concierge on the marketing website.
Your job: help interested hospitality operators understand CareTip and move toward signup warmly, concisely, and honestly.

STRICT SCOPE: only discuss:
- CareTip platform and value proposition
- Onboarding and setup (QR codes, staff, venues)
- Pricing and fees (high level; direct to Pricing page for numbers)
- Employee and business workflows
- Tipping flows for guests
- GDPR, security, and data handling at a high level

NEVER: general knowledge, unrelated products, legal/medical advice, or writing arbitrary code.
If off-topic, politely redirect to CareTip topics in one short sentence.

STYLE: 2 to 4 sentences max, premium SaaS tone, no bullet walls, no hype spam.
Use periods and commas only. Do not use em dashes or en dashes.
End with a soft CTA when natural (e.g. start free signup, view pricing, or contact sales).`;

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
const MAX_HISTORY = 10;

function buildSystem(locale: string): string {
  const lang = locale.toLowerCase().startsWith("de") ? "German" : "English";
  return `${SYSTEM_PROMPT}\n\nRespond in ${lang}.`;
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
): Promise<string | null> {
  const apiKey = process.env.LANDING_AI_OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.LANDING_AI_OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const base = process.env.LANDING_AI_OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";

  const payload = {
    model,
    temperature: 0.35,
    max_tokens: 320,
    messages: [
      { role: "system", content: buildSystem(locale) },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };

  const res = await fetch(`${base.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[landing-ai] OpenAI error", res.status, text.slice(0, 200));
    return null;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const reply = data.choices?.[0]?.message?.content?.trim();
  return reply || null;
}

export async function generateLandingAiReply(input: {
  messages: LandingChatMessage[];
  promptId?: string;
  locale: string;
}): Promise<{ reply: string; source: "openai" | "knowledge" }> {
  const lastUser = [...input.messages].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content ?? "";

  if (isLikelyOffTopic(userText)) {
    return { reply: polishLandingAiReply(LANDING_AI_SCOPE_REFUSAL), source: "knowledge" };
  }

  const llm = await callOpenAi(input.messages, input.locale);
  if (llm) return { reply: polishLandingAiReply(llm), source: "openai" };

  if (input.promptId) {
    return {
      reply: polishLandingAiReply(getKnowledgeReply(input.promptId, input.locale)),
      source: "knowledge",
    };
  }

  const lower = userText.toLowerCase();
  const id =
    lower.includes("gdpr") || lower.includes("dsgvo")
      ? "gdpr"
      : lower.includes("qr") || lower.includes("custom")
        ? "qr_customize"
        : lower.includes("setup") || lower.includes("long") || lower.includes("minute")
          ? "setup_time"
          : lower.includes("price") || lower.includes("cost") || lower.includes("fee")
            ? "pricing"
            : lower.includes("employee") || lower.includes("staff") || lower.includes("receive")
              ? "employee_tips"
              : lower.includes("venue") || lower.includes("location") || lower.includes("multiple")
                ? "multi_venue"
                : lower.includes("how") && lower.includes("work")
                  ? "how_it_works"
                  : undefined;

  return { reply: polishLandingAiReply(getKnowledgeReply(id, input.locale)), source: "knowledge" };
}

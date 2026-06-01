import { resolveApiBaseUrl } from "./apiOrigin";
import { isAiAssistantEnabled } from "./featureFlags";

function landingAiPath(suffix: string): string {
  const base = resolveApiBaseUrl();
  const p = `/api/landing-ai${suffix}`;
  return base ? `${base}${p}` : p;
}

export type LandingChatMessage = { role: "user" | "assistant"; content: string };

export async function postLandingAiChat(input: {
  messages: LandingChatMessage[];
  promptId?: string;
  locale: string;
  signal?: AbortSignal;
}): Promise<{
  reply: string;
  source?: "openai" | "knowledge";
  fallbackReason?: string | null;
  usingKnowledgeFallback?: boolean;
}> {
  if (!isAiAssistantEnabled()) {
    throw new Error("AI assistant is disabled");
  }

  const res = await fetch(landingAiPath("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    signal: input.signal,
    body: JSON.stringify({
      messages: input.messages,
      promptId: input.promptId,
      locale: input.locale,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    reply?: string;
    source?: "openai" | "knowledge";
    fallbackReason?: string | null;
    usingKnowledgeFallback?: boolean;
  };
  if (!res.ok) {
    throw new Error(data.message ?? "Could not reach the assistant");
  }
  if (!data.reply) throw new Error("Empty reply");
  return {
    reply: data.reply,
    source: data.source,
    fallbackReason: data.fallbackReason,
    usingKnowledgeFallback: data.usingKnowledgeFallback,
  };
}

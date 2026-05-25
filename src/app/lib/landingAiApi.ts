import { resolveApiBaseUrl } from "./apiOrigin";

function landingAiPath(suffix: string): string {
  const base = resolveApiBaseUrl();
  const p = `/api/landing-ai${suffix}`;
  return base ? `${base}${p}` : p;
}

export type LandingChatMessage = { role: "user" | "assistant"; content: string };

export async function postLandingAiChat(body: {
  messages: LandingChatMessage[];
  promptId?: string;
  locale: string;
  signal?: AbortSignal;
}): Promise<{ reply: string; source?: string }> {
  const res = await fetch(landingAiPath("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    signal: body.signal,
    body: JSON.stringify({
      messages: body.messages,
      promptId: body.promptId,
      locale: body.locale,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { message?: string; reply?: string };
  if (!res.ok) {
    throw new Error(data.message ?? "Could not reach the assistant");
  }
  if (!data.reply) throw new Error("Empty reply");
  return { reply: data.reply, source: data.source };
}

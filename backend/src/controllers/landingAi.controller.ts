import type { Request, Response } from "express";
import { generateLandingAiReply, validateChatBody } from "../services/landingAi.service.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";

const ALLOWED_EVENTS = new Set([
  "popup_open",
  "launcher_visible",
  "prompt_click",
  "question_asked",
  "cta_after_ai",
  "panel_dismiss",
  "intent_threshold",
]);

/**
 * POST /api/landing-ai/chat — public onboarding concierge (scoped).
 */
export async function landingAiChat(req: Request, res: Response) {
  try {
    const parsed = validateChatBody(req.body);
    if ("error" in parsed) {
      return res.status(400).json({ message: parsed.error });
    }

    const { reply, source } = await generateLandingAiReply(parsed);
    return res.json({ reply, source });
  } catch (err) {
    logServerError("landingAi.chat", err);
    return res.status(500).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.generic),
    });
  }
}

/**
 * POST /api/landing-ai/events — lightweight analytics (no auth).
 */
export async function landingAiTrackEvent(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const event = typeof body.event === "string" ? body.event.trim() : "";
    if (!ALLOWED_EVENTS.has(event)) {
      return res.status(400).json({ message: "Invalid event" });
    }
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim().slice(0, 64) : "anon";
    const meta =
      body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
        ? (body.meta as Record<string, unknown>)
        : undefined;

    if (process.env.NODE_ENV !== "production") {
      console.info("[landing-ai:event]", event, sessionId, meta ?? {});
    }

    return res.json({ ok: true });
  } catch (err) {
    logServerError("landingAi.trackEvent", err);
    return res.status(500).json({ message: "Could not record event" });
  }
}

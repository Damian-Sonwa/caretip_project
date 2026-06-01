/** Parse boolean env flags (`true` / `1` / `yes` / `on`). Empty or unset → false. */
function parseEnvFlag(raw: string | undefined): boolean {
  if (raw === undefined || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

/**
 * Landing Ask CareTip assistant (`/api/landing-ai/*` public chat + events).
 * Set `ENABLE_AI_ASSISTANT=true` to accept chat traffic. Default: disabled (503).
 * Routes and services remain mounted for future activation.
 */
export function isAiAssistantEnabled(): boolean {
  return parseEnvFlag(process.env.ENABLE_AI_ASSISTANT);
}

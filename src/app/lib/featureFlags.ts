/** Parse boolean env flags (`true` / `1` / `yes` / `on`). Empty or unset → false. */
function parseEnvFlag(raw: string | undefined): boolean {
  if (raw === undefined || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

/**
 * Landing Ask CareTip assistant (floating launcher + chat panel).
 * Set `VITE_ENABLE_AI_ASSISTANT=true` in `.env.local` to re-enable for MVP+.
 * Default: disabled.
 */
export function isAiAssistantEnabled(): boolean {
  return parseEnvFlag(import.meta.env.VITE_ENABLE_AI_ASSISTANT);
}

/**
 * Opt-in auth / routing debug logs.
 * Enable with `localStorage.setItem('caretip_auth_debug', '1')` or in Vite dev (`import.meta.env.DEV`).
 */
const PREFIX = "[CareTip:auth]";

export function authDebug(message: string, data?: Record<string, unknown>): void {
  try {
    const dev =
      typeof import.meta !== "undefined" && import.meta.env && (import.meta.env as { DEV?: boolean }).DEV === true;
    const flagged =
      typeof localStorage !== "undefined" && localStorage.getItem("caretip_auth_debug") === "1";
    if (!dev && !flagged) return;
    if (data && Object.keys(data).length > 0) {
      console.log(PREFIX, message, data);
    } else {
      console.log(PREFIX, message);
    }
  } catch {
    // ignore (SSR / privacy mode)
  }
}

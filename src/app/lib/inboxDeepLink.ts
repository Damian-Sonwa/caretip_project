/**
 * Maps a signup email domain to a webmail URL for "Open my email" UX.
 * Unknown domains fall back to `mailto:` so the system mail client can open.
 */
export type InboxOpenTarget =
  | { kind: "web"; href: string; providerLabel: string }
  | { kind: "mailto"; href: string; providerLabel: "Email app" };

export function resolveInboxOpenTarget(email: string): InboxOpenTarget {
  const raw = String(email ?? "").trim().toLowerCase();
  const at = raw.lastIndexOf("@");
  const domain = at >= 0 ? raw.slice(at + 1) : "";

  if (domain === "gmail.com" || domain === "googlemail.com") {
    return { kind: "web", href: "https://mail.google.com", providerLabel: "Gmail" };
  }
  if (
    domain === "outlook.com" ||
    domain === "hotmail.com" ||
    domain === "live.com" ||
    domain === "msn.com"
  ) {
    return { kind: "web", href: "https://outlook.live.com", providerLabel: "Outlook" };
  }
  if (domain === "yahoo.com" || domain === "ymail.com" || domain === "rocketmail.com") {
    return { kind: "web", href: "https://mail.yahoo.com", providerLabel: "Yahoo Mail" };
  }

  return {
    kind: "mailto",
    href: `mailto:${encodeURIComponent(raw)}`,
    providerLabel: "Email app",
  };
}

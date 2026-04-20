/**
 * Normalizes `VITE_API_URL` when hosts (e.g. Netlify) store a full `.env` line or other junk in the value.
 * Wrong: `VITE_API_URL=https://api.example.com` → browser would request `/VITE_API_URL=https://...` (404).
 */
function sanitizeApiBaseInput(raw: string): string {
  let s = raw.trim().replace(/\/+$/, "");
  if (!s) return "";
  if (s.toUpperCase().startsWith("VITE_API_URL=")) {
    s = s.slice("VITE_API_URL=".length).trim().replace(/\/+$/, "");
  }
  const m = s.match(/https?:\/\/[^\s"'`]+/i);
  if (m && m.index !== undefined && m.index > 0) {
    s = m[0].trim().replace(/\/+$/, "");
  }
  return s;
}

function requireHttpBase(s: string): string {
  if (!s) return "";
  const t = s.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(t)) return t;
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    console.warn(
      `[Caretip] VITE_API_URL must be an absolute http(s) URL after normalization. Got: "${s.slice(0, 120)}"`
    );
  }
  return "";
}

/**
 * Resolves the REST/Socket API base URL.
 * In dev, if the page is opened via a LAN IP but VITE_API_URL points at localhost,
 * the browser would call the wrong machine — fall back to same-origin + Vite proxy.
 */
export function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL;
  const base =
    typeof raw === "string" && raw.trim() !== ""
      ? requireHttpBase(sanitizeApiBaseInput(raw))
      : "";

  if (typeof window === "undefined" || !import.meta.env.DEV) {
    return base;
  }

  const host = window.location.hostname;
  const pageIsLoopback = host === "localhost" || host === "127.0.0.1" || host === "[::1]";

  if (pageIsLoopback) {
    return base;
  }

  if (base && /\b(localhost|127\.0\.0\.1)\b/i.test(base)) {
    if (import.meta.env.DEV) {
      console.warn(
        `[Caretip] VITE_API_URL (${base}) uses localhost but the app is opened from "${host}". ` +
          "Using same-origin /api (Vite proxy) instead."
      );
    }
    return "";
  }

  return base;
}

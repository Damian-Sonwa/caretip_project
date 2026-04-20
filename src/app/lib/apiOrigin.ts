/**
 * Resolves the REST/Socket API base URL.
 * In dev, if the page is opened via a LAN IP but VITE_API_URL points at localhost,
 * the browser would call the wrong machine — fall back to same-origin + Vite proxy.
 */
export function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL;
  const base = typeof raw === "string" ? raw.trim().replace(/\/+$/, "") : "";

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

import { resolveApiBaseUrl } from "./apiOrigin";

/**
 * Turns API-relative media paths (`/uploads/...`) into absolute URLs for `<img src>`.
 * Browsers resolve relative paths against the page origin, not the API — so stored paths break on static hosts.
 *
 * In dev, absolute URLs like `http://localhost:3001/uploads/...` are normalized to `/uploads/...` so the
 * Vite proxy serves them from the SPA origin (avoids broken avatars when the API returns a different host/port).
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (url == null || String(url).trim() === "") return undefined;
  const s = String(url).trim();

  if (/^https?:\/\//i.test(s)) {
    try {
      const parsed = new URL(s);
      if (parsed.pathname.startsWith("/uploads/") && typeof import.meta.env !== "undefined" && import.meta.env.DEV) {
        return `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return s;
    }
    return s;
  }

  const base = resolveApiBaseUrl().replace(/\/$/, "");
  if (s.startsWith("/")) {
    return base ? `${base}${s}` : s;
  }
  if (/^uploads\//i.test(s)) {
    const withSlash = `/${s}`;
    return base ? `${base}${withSlash}` : withSlash;
  }
  return s;
}

import { resolvePublicApiBaseUrl } from "../config/publicApiBaseUrl.js";

/**
 * Stored media is often `/uploads/...` (same origin as the API). Browsers resolve that against the
 * SPA host, so the frontend must either set `VITE_API_URL` or the API must return absolute URLs.
 * This helper does the latter for any path under `/uploads/`.
 */
export function absolutizePublicMediaPath(path: string | null | undefined): string | null {
  if (path == null) return null;
  const s = String(path).trim();
  if (s === "") return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (!s.startsWith("/uploads/")) return s;
  const base = resolvePublicApiBaseUrl().replace(/\/+$/, "");
  return `${base}${s}`;
}

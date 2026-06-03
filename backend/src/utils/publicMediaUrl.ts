import { resolvePublicApiBaseUrl } from "../config/publicApiBaseUrl.js";
import { isLegacyApiDiskMediaPath, isSupabasePublicStorageUrl } from "./mediaPathKind.js";
import { isSupabaseStorageConfigured } from "../lib/supabaseStorageClient.js";
import { normalizeSupabasePublicStorageUrl } from "./normalizeSupabaseStorageUrl.js";

/**
 * Stored media is often `/uploads/...` (same origin as the API). Browsers resolve that against the
 * SPA host, so the frontend must either set `VITE_API_URL` or the API must return absolute URLs.
 * Supabase public URLs are returned unchanged. Legacy disk paths are omitted in production when
 * Supabase Storage is configured (Render disk is ephemeral).
 */
export function absolutizePublicMediaPath(path: string | null | undefined): string | null {
  if (path == null) return null;
  const s = String(path).trim();
  if (s === "") return null;

  if (/^https?:\/\//i.test(s)) {
    if (isSupabasePublicStorageUrl(s)) return normalizeSupabasePublicStorageUrl(s);
    if (
      process.env.NODE_ENV === "production" &&
      isSupabaseStorageConfigured() &&
      isLegacyApiDiskMediaPath(s)
    ) {
      return null;
    }
    return s;
  }

  if (isLegacyApiDiskMediaPath(s)) {
    if (process.env.NODE_ENV === "production" && isSupabaseStorageConfigured()) {
      return null;
    }
    if (!s.startsWith("/uploads/")) return s;
    const base = resolvePublicApiBaseUrl().replace(/\/+$/, "");
    return `${base}${s}`;
  }

  return s;
}

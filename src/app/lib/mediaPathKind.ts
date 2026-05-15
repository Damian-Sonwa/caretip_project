/** True when the value is a Supabase Storage public object URL. */
export function isSupabasePublicStorageUrl(url: string): boolean {
  return /\.supabase\.co\/storage\/v1\/object\/public\//i.test(url);
}

/** Stale Render/local API disk URLs that 404 after moving storage to Supabase. */
export function isBrokenLegacyApiDiskMediaUrl(url: string): boolean {
  const s = url.trim();
  if (!s || isSupabasePublicStorageUrl(s)) return false;
  if (s.startsWith("/uploads/")) return true;
  return /^https?:\/\//i.test(s) && /\/uploads\//i.test(s);
}

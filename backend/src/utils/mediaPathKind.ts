/** True when the value is a Supabase Storage public object URL. */
export function isSupabasePublicStorageUrl(url: string): boolean {
  return /\.supabase\.co\/storage\/v1\/object\/public\//i.test(url);
}

/**
 * Local API disk paths (`/uploads/...` or `https://api.example.com/uploads/...`).
 * On Render these files are ephemeral and usually 404 after redeploy when Supabase is used instead.
 */
export function isLegacyApiDiskMediaPath(path: string): boolean {
  const s = path.trim();
  if (!s) return false;
  if (isSupabasePublicStorageUrl(s)) return false;
  if (s.startsWith("/uploads/")) return true;
  if (/^https?:\/\//i.test(s) && /\/uploads\//i.test(s)) return true;
  return false;
}

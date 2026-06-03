import { isSupabasePublicStorageUrl } from "./mediaPathKind";

const MISCONFIGURED_BUCKET = "caretip official";
const CANONICAL_BUCKET = "caretip";

/** Client-side mirror of backend normalize — fixes logos already stored with the wrong bucket segment. */
export function normalizeSupabasePublicStorageUrl(url: string): string {
  if (!isSupabasePublicStorageUrl(url)) return url;
  try {
    const u = new URL(url.trim());
    const m = u.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!m?.[1] || !m[2]) return url;

    const bucketDecoded = decodeURIComponent(m[1].replace(/\+/g, " "));
    if (bucketDecoded !== MISCONFIGURED_BUCKET) return url;

    u.pathname = `/storage/v1/object/public/${CANONICAL_BUCKET}/${m[2]}`;
    return u.toString();
  } catch {
    return url;
  }
}

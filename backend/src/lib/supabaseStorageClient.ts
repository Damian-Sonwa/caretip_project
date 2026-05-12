import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let warnedMissingServiceRole = false;

/** Same project URL as the dashboard; SPA often sets `NEXT_PUBLIC_SUPABASE_URL` only. */
function supabaseProjectUrl(): string | undefined {
  const direct = process.env.SUPABASE_URL?.trim();
  if (direct) return direct;
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
}

/** Service role only — never the anon key (anon cannot replace server-side Storage uploads in our flow). */
function supabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(supabaseProjectUrl() && supabaseServiceRoleKey());
}

/** Log once when URL exists but service role is missing (common misconfig after adding only `NEXT_PUBLIC_*`). */
export function warnIfSupabaseUrlButNoServiceRole(): void {
  if (warnedMissingServiceRole) return;
  if (!supabaseProjectUrl() || supabaseServiceRoleKey()) return;
  warnedMissingServiceRole = true;
  console.warn(
    "[upload] Supabase Storage disabled: set SUPABASE_SERVICE_ROLE_KEY in backend/root .env (Dashboard → Settings → API → service_role). " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be used for server uploads; without the service role, logos stay on disk only.",
  );
}

/** Default `caretip` — create this bucket in Supabase (public read recommended for logos/avatars). */
export function supabaseStorageBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "caretip";
}

function getServiceClient(): SupabaseClient {
  if (!isSupabaseStorageConfigured()) {
    throw new Error("File upload isn't available right now. Please try again later.");
  }
  if (!_client) {
    _client = createClient(supabaseProjectUrl()!, supabaseServiceRoleKey()!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

/**
 * Upload bytes to `bucket/objectKey` and return the **public** object URL (bucket must allow public read,
 * or expose objects via your CDN — same pattern as Cloudinary `secure_url`).
 */
export async function uploadBufferToSupabasePublicUrl(
  objectKey: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const bucket = supabaseStorageBucketName();
  const key = objectKey.replace(/^\/+/, "").replace(/\/+/g, "/");
  const supabase = getServiceClient();
  const { error } = await supabase.storage.from(bucket).upload(key, buffer, {
    contentType,
    upsert: false,
    cacheControl: "3600",
  });
  if (error) {
    throw new Error("We couldn't save your file. Please try again.");
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  if (!data?.publicUrl) {
    throw new Error("We couldn't save your file. Please try again.");
  }
  return data.publicUrl;
}

/**
 * Parses a `getPublicUrl` style URL: `/storage/v1/object/public/{bucket}/{objectPath}`.
 */
export function parseSupabasePublicStorageUrl(
  publicUrl: string,
): { bucket: string; objectPath: string } | null {
  try {
    const u = new URL(publicUrl.trim());
    const m = u.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (!m?.[1] || !m[2]) return null;
    return { bucket: m[1], objectPath: decodeURIComponent(m[2]) };
  } catch {
    return null;
  }
}

/**
 * Confirms the object exists in Storage using the service role (same auth as upload).
 * Call this after `uploadBufferToSupabasePublicUrl` and before persisting `logoPath` in the database.
 */
export async function assertUploadedObjectReadableInBucket(publicUrl: string): Promise<void> {
  if (!isSupabaseStorageConfigured()) {
    throw new Error("File upload isn't available right now. Please try again later.");
  }
  const parsed = parseSupabasePublicStorageUrl(publicUrl);
  if (!parsed) {
    throw new Error("We couldn't complete the upload. Please try again.");
  }
  const supabase = getServiceClient();
  const { error } = await supabase.storage.from(parsed.bucket).download(parsed.objectPath);
  if (error) {
    throw new Error("We couldn't confirm the upload. Please try again.");
  }
}

/** Best-effort delete after a failed DB commit (avoids orphaned objects). */
export async function removeUploadedObjectByPublicUrlIfPossible(publicUrl: string): Promise<void> {
  if (!isSupabaseStorageConfigured()) return;
  const parsed = parseSupabasePublicStorageUrl(publicUrl);
  if (!parsed) return;
  try {
    const supabase = getServiceClient();
    await supabase.storage.from(parsed.bucket).remove([parsed.objectPath]);
  } catch {
    /* ignore */
  }
}

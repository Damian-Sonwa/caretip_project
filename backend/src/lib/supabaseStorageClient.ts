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
    throw new Error(
      "Supabase Storage is not configured (set SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL).",
    );
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
    throw new Error(error.message || "Supabase storage upload failed.");
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  if (!data?.publicUrl) {
    throw new Error("Supabase storage returned no public URL (check bucket visibility).");
  }
  return data.publicUrl;
}

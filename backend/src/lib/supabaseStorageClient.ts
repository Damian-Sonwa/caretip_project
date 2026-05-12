import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function isSupabaseStorageConfigured(): boolean {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && key);
}

/** Default `caretip` — create this bucket in Supabase (public read recommended for logos/avatars). */
export function supabaseStorageBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "caretip";
}

function getServiceClient(): SupabaseClient {
  if (!isSupabaseStorageConfigured()) {
    throw new Error("Supabase Storage is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).");
  }
  if (!_client) {
    _client = createClient(process.env.SUPABASE_URL!.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(), {
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

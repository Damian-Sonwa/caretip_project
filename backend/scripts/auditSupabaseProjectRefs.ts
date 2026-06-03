/**
 * Prints Supabase project refs from env (no secrets). Run:
 *   npx dotenv -e ../.env -- tsx scripts/auditSupabaseProjectRefs.ts
 */
import "../src/loadEnv.js";

function refFromDatabaseUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const m = raw.match(/\/\/postgres\.([^:]+):/i);
  return m?.[1] ?? null;
}

function refFromSupabaseUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const m = raw.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1] ?? null;
}

function refFromServiceRoleJwt(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const parts = raw.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")) as {
      ref?: string;
      iss?: string;
    };
    if (payload.ref) return payload.ref;
    const iss = payload.iss ?? "";
    const m = iss.match(/\/auth\/v1$/);
    if (m) return null;
    return payload.ref ?? null;
  } catch {
    return null;
  }
}

function hostFromDatabaseUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const m = raw.match(/@([^:/]+)/);
  return m?.[1] ?? null;
}

const sources = {
  DATABASE_URL: {
    ref: refFromDatabaseUrl(process.env.DATABASE_URL),
    host: hostFromDatabaseUrl(process.env.DATABASE_URL),
  },
  SUPABASE_URL: { ref: refFromSupabaseUrl(process.env.SUPABASE_URL) },
  NEXT_PUBLIC_SUPABASE_URL: { ref: refFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) },
  SUPABASE_SERVICE_ROLE_KEY: { ref: refFromServiceRoleJwt(process.env.SUPABASE_SERVICE_ROLE_KEY) },
  SUPABASE_STORAGE_BUCKET: { value: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "(default: caretip)" },
};

const refs = new Set(
  [
    sources.DATABASE_URL.ref,
    sources.SUPABASE_URL.ref,
    sources.NEXT_PUBLIC_SUPABASE_URL.ref,
    sources.SUPABASE_SERVICE_ROLE_KEY.ref,
  ].filter(Boolean) as string[],
);

console.log(JSON.stringify({ sources, uniqueProjectRefs: [...refs], aligned: refs.size <= 1 }, null, 2));

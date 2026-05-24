/**
 * Runtime Postgres URL for PrismaClient (Express): **`DATABASE_URL` only** (Supabase pooler).
 * Transaction pooler uses port **6543** + `pgbouncer=true` + `connection_limit=1`.
 * Session pooler (5432) is for migrations only — using it at runtime exhausts Supabase session slots.
 *
 * SSL: ensures `sslmode=require` when missing.
 */

let loggedNormalization = false;

/**
 * Merge query params into a postgresql URL without breaking passwords that contain `?` or `&`
 * (falls back to suffix-append when parsing fails).
 */
function ensureQueryParams(raw: string, add: Record<string, string>): string {
  const qIndex = raw.indexOf("?");
  if (qIndex === -1) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(add)) {
      params.set(k, v);
    }
    return `${raw}?${params.toString()}`;
  }

  const base = raw.slice(0, qIndex);
  const query = raw.slice(qIndex + 1);
  const params = new URLSearchParams(query);
  for (const [k, v] of Object.entries(add)) {
    if (!params.has(k)) {
      params.set(k, v);
    }
  }
  return `${base}?${params.toString()}`;
}

function isSupabasePoolerHost(hostname: string): boolean {
  return hostname.includes("pooler.supabase.com");
}

/**
 * Normalize Supabase pooler URLs for Prisma runtime (single connection per process).
 * Rewrites session pooler (5432) → transaction pooler (6543) unless DATABASE_USE_SESSION_POOLER=true.
 */
export function getDatabaseUrlForPrisma(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "DATABASE_URL is required. Set it in .env to your Supabase pooler URL (see backend/.env.example).",
    );
  }

  const lower = raw.toLowerCase();
  if (
    /\blocalhost\b/.test(lower) ||
    /\b127\.0\.0\.1\b/.test(lower) ||
    lower.includes("[::1]") ||
    lower.includes("://::1")
  ) {
    throw new Error(
      "DATABASE_URL must not use localhost or loopback. Use the Supabase pooler hostname from your project settings.",
    );
  }

  let url = raw.replace(/\/postgres\?\?/i, "/postgres?");

  if (!/sslmode=/i.test(url)) {
    url = ensureQueryParams(url, { sslmode: "require" });
  }

  let usedSessionPooler = false;
  try {
    const parsed = new URL(url);
    if (isSupabasePoolerHost(parsed.hostname)) {
      const port = parsed.port || "5432";
      const forceSession = process.env.DATABASE_USE_SESSION_POOLER === "true";

      if ((port === "5432" || port === "") && !forceSession) {
        parsed.port = "6543";
        parsed.searchParams.set("pgbouncer", "true");
        parsed.searchParams.set("connection_limit", "1");
        parsed.searchParams.delete("pool_timeout");
        url = parsed.toString();
        usedSessionPooler = true;
      } else if (port === "6543") {
        if (!parsed.searchParams.has("pgbouncer")) {
          parsed.searchParams.set("pgbouncer", "true");
        }
        if (!parsed.searchParams.has("connection_limit")) {
          parsed.searchParams.set("connection_limit", "1");
        }
        url = parsed.toString();
      } else if (port === "5432" && forceSession) {
        if (!parsed.searchParams.has("connection_limit")) {
          parsed.searchParams.set("connection_limit", "1");
        }
        url = parsed.toString();
        usedSessionPooler = true;
      }
    } else if (url.includes("pooler.supabase.com:6543")) {
      url = ensureQueryParams(url, { pgbouncer: "true", connection_limit: "1" });
    }
  } catch {
    if (url.includes("pooler.supabase.com:6543")) {
      url = ensureQueryParams(url, { pgbouncer: "true", connection_limit: "1" });
    } else if (url.includes("pooler.supabase.com:5432")) {
      url = url.replace(":5432/", ":6543/");
      url = ensureQueryParams(url, { pgbouncer: "true", connection_limit: "1" });
      usedSessionPooler = true;
    }
  }

  if (usedSessionPooler && !loggedNormalization) {
    loggedNormalization = true;
    console.warn(
      "[database] DATABASE_URL used Supabase session pooler (5432). Runtime Prisma uses transaction pooler (6543) with connection_limit=1 to avoid max-clients errors. Set DATABASE_USE_SESSION_POOLER=true only if you intend session mode.",
    );
  }

  return url;
}

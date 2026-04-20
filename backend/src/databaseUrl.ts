/**
 * Runtime Postgres URL for PrismaClient (Express): **`DATABASE_URL` only** (Supabase pooler).
 * Transaction pooler uses port **6543** + `pgbouncer=true`; session pooler often uses **5432** without those flags.
 *
 * SSL: ensures `sslmode=require` when missing.
 */

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

  let url = raw;
  // Common typo: .../postgres??... breaks the query string
  url = url.replace(/\/postgres\?\?/i, "/postgres?");

  if (!/sslmode=/i.test(url)) {
    url = ensureQueryParams(url, { sslmode: "require" });
  }

  if (url.includes("pooler.supabase.com:6543")) {
    url = ensureQueryParams(url, { pgbouncer: "true", connection_limit: "1" });
  }

  return url;
}

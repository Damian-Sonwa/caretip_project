/**
 * Return a Session pooler URL (5432) for Prisma migrate / DDL.
 * Transaction pooler (6543) often hangs or blocks DDL.
 *
 * Priority:
 * - process.env.DATABASE_URL (Render/CI)
 * - repo root .env (local dev convenience)
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "..", ".env");

function readDatabaseUrlFromFile(p) {
  if (!existsSync(p)) return null;
  const text = readFileSync(p, "utf8");
  const line = text.split(/\r?\n/).find((l) => /^\s*DATABASE_URL=/.test(l));
  if (!line) return null;
  const match = line.match(/DATABASE_URL\s*=\s*["']([^"']+)["']/);
  return match ? match[1] : line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim();
}

const raw = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) || readDatabaseUrlFromFile(envPath);
if (!raw) {
  console.error(
    "DATABASE_URL is missing. Set DATABASE_URL in environment variables (Render) or add it to repo root .env for local dev."
  );
  process.exit(1);
}

const u = new URL(raw);
u.port = "5432";
u.searchParams.delete("pgbouncer");
u.searchParams.delete("connection_limit");
if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
process.stdout.write(u.toString());

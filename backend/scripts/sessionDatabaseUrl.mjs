/**
 * Read DATABASE_URL from repo root .env and return a Session pooler URL (5432)
 * for Prisma migrate / DDL (transaction pooler 6543 often hangs or blocks DDL).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", "..", ".env");
const text = readFileSync(envPath, "utf8");
const line = text.split(/\r?\n/).find((l) => /^\s*DATABASE_URL=/.test(l));
if (!line) {
  console.error("DATABASE_URL not found in", envPath);
  process.exit(1);
}
const match = line.match(/DATABASE_URL\s*=\s*["']([^"']+)["']/);
const raw = match ? match[1] : line.replace(/^\s*DATABASE_URL\s*=\s*/, "").trim();
const u = new URL(raw);
u.port = "5432";
u.searchParams.delete("pgbouncer");
u.searchParams.delete("connection_limit");
if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
process.stdout.write(u.toString());

/**
 * Run `prisma migrate deploy` against Supabase using the Session pooler (5432).
 * Transaction pooler (6543) is unreliable for DDL and can hang.
 * Sets DATABASE_URL for the child process only; your .env can keep the 6543 app URL.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");
const sessionUrl = execSync(`node "${path.join(__dirname, "sessionDatabaseUrl.mjs")}"`, {
  encoding: "utf8",
}).trim();
if (!sessionUrl) {
  console.error("Could not build session DATABASE_URL (see scripts/sessionDatabaseUrl.mjs).");
  process.exit(1);
}
try {
  execSync("npx prisma migrate deploy --schema=prisma/schema.prisma", {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: sessionUrl },
    stdio: "inherit",
  });
} catch (e) {
  // In production, Prisma stops when a prior migration failed (P3009).
  // Do not crash the whole API process; log a clear message so the operator can resolve.
  console.error("[migrate] prisma migrate deploy failed; starting API anyway.");
  console.error(
    "[migrate] Resolve the failed migration, then redeploy. See: https://pris.ly/d/migrate-resolve",
  );
  console.error(e);
}

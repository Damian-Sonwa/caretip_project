/** Run: npm run env:check — prints whether secrets are loaded (no values). */
import "dotenv/config";
import "./loadEnv.js";
import { getDatabaseUrlForPrisma } from "./databaseUrl.js";

const hasJwt = Boolean(process.env.JWT_SECRET?.trim());
const hasAdminSeed = Boolean(process.env.ADMIN_SEED_SECRET?.trim());
const adminSeedOk = !hasAdminSeed || (process.env.ADMIN_SEED_SECRET!.trim().length >= 8);

let dbOk = false;
try {
  getDatabaseUrlForPrisma();
  dbOk = true;
} catch {
  dbOk = false;
}

console.log("JWT_SECRET:", hasJwt ? "set" : "MISSING");
console.log("DATABASE_URL:", dbOk ? "set (validated, non-localhost)" : "MISSING or invalid");
console.log(
  "STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET:",
  process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim()
    ? "set"
    : "optional for tips until payments enabled",
);
console.log(
  "ADMIN_SEED_SECRET:",
  !hasAdminSeed ? "MISSING (required for npm run admin:create)" : adminSeedOk ? "set" : "too short (use at least 8 characters)",
);
if (!hasJwt || !dbOk) {
  process.exitCode = 1;
}
if (hasAdminSeed && !adminSeedOk) {
  process.exitCode = 1;
}

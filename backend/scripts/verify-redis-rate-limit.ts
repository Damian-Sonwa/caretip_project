/**
 * Verify REDIS_URL connectivity for distributed rate limits.
 * Run: npm run verify:redis (backend)
 */
import "../src/loadEnv.js";
import { checkAndIncrementLimitDistributed } from "../src/utils/rateLimitStore.js";

async function main(): Promise<void> {
  const configured = Boolean(process.env.REDIS_URL?.trim());
  console.log(`REDIS_URL configured: ${configured ? "yes" : "no"}`);
  if (configured) {
    const u = process.env.REDIS_URL!.trim();
    try {
      const parsed = new URL(u.replace(/^redis:\/\//, "http://"));
      console.log(`REDIS_URL host: ${parsed.hostname || "(missing)"}`);
      console.log(`REDIS_URL port: ${parsed.port || "6379"}`);
    } catch {
      console.log("REDIS_URL: could not parse (check format)");
    }
  }

  console.log("Triggering rate limit store (initializes Redis if configured)...");
  await checkAndIncrementLimitDistributed({
    key: `redis-verify:${Date.now()}`,
    maxPerWindow: 999,
    windowMs: 60_000,
  });
  console.log("Store probe complete — see [rateLimit] line above.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

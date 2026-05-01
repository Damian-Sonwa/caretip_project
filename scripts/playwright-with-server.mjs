/**
 * Starts Vite ourselves, waits until it answers HTTP, runs Playwright, then stops Vite.
 * Avoids Playwright's built-in `webServer` (often appears "hung" while waiting on URL / first compile).
 */
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const baseURL = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173").replace(/\/$/, "");
const { hostname, port } = new URL(baseURL);

const vite = spawn(
  "npx",
  ["vite", "--host", hostname, "--port", port || "5173", "--strictPort"],
  {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  },
);

let healthy = false;
for (let i = 0; i < 240; i++) {
  if (vite.exitCode !== null) {
    console.error(
      `[e2e] Vite exited before becoming ready (exit ${vite.exitCode}). Port ${port} may be in use — stop other dev servers and retry.`,
    );
    process.exit(1);
  }
  try {
    const r = await fetch(baseURL, { redirect: "manual" });
    if (r.ok || r.status === 304) {
      healthy = true;
      break;
    }
  } catch {
    /* not listening yet */
  }
  await delay(500);
}

if (!healthy) {
  console.error(`[e2e] Timed out after ~2m waiting for ${baseURL}`);
  try {
    vite.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  process.exit(1);
}

console.info(`[e2e] Vite is up at ${baseURL} — running Playwright…`);

const pw = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, E2E_BASE_URL: baseURL },
});

try {
  vite.kill("SIGTERM");
} catch {
  /* ignore */
}
await delay(400);
process.exit(pw.status === null ? 1 : pw.status);

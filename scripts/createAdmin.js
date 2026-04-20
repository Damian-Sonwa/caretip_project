#!/usr/bin/env node
/**
 * Wrapper: runs `npm run admin:create` in backend/ (tsx + Prisma + .env).
 * Usage from repo root:
 *   node scripts/createAdmin.js <email> <password>
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.join(here, "..", "backend");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const result = spawnSync(
  npm,
  ["run", "admin:create", "--", ...process.argv.slice(2)],
  {
    cwd: backend,
    stdio: "inherit",
    env: process.env,
    shell: true,
  },
);

process.exit(result.status === null ? 1 : result.status);

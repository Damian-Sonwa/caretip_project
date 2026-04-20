/**
 * Same as createAdmin.js but sets ALLOW_MULTIPLE_SUPER_ADMINS=true so a second+ SUPER_ADMIN can be created.
 * Usage: npm run admin:create:extra -- email@example.com 'password'
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");
const r = spawnSync(
  "npx",
  ["tsx", "scripts/createAdmin.js", ...process.argv.slice(2)],
  {
    cwd: backendRoot,
    env: { ...process.env, ALLOW_MULTIPLE_SUPER_ADMINS: "true" },
    stdio: "inherit",
    shell: true,
  },
);
process.exit(r.status ?? 1);

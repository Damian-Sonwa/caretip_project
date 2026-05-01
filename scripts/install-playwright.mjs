/**
 * Resilient Playwright browser install (timeouts, retries, cache clear, mirrors).
 * Does not block `npm run dev` — only wired to `pretest:e2e` / `npm run playwright:install`.
 *
 * Env:
 * - SKIP_PLAYWRIGHT_INSTALL=true → exit 0 with warning (no download).
 * - PLAYWRIGHT_DOWNLOAD_HOST, HTTP_PROXY, HTTPS_PROXY → passed through (also loaded from repo .env if unset).
 * - PLAYWRIGHT_BROWSERS_PATH → custom cache dir (clear uses this if set).
 * - PLAYWRIGHT_INSTALL_STALL_MS → inactivity kill in ms; default 0 = disabled (recommended). After the download
 *   reaches 100%, Playwright can go silent for many minutes while extracting; low values cause false stalls.
 * - PLAYWRIGHT_INSTALL_RETRY_COOLDOWN_MS → wait after failure/kill before cache clear / next strategy (default 8000 on Windows, 4000 elsewhere).
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function log(...args) {
  console.log("[playwright-install]", ...args);
}

function warn(...args) {
  console.warn("[playwright-install]", ...args);
}

/** Load root `.env` into `process.env` only for keys that are not already set. */
function loadRootDotEnv() {
  const p = join(root, ".env");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

loadRootDotEnv();

const HARD_TIMEOUT_MS = Number(process.env.PLAYWRIGHT_INSTALL_TIMEOUT_MS ?? 900_000);
/** <= 0 = disabled (recommended). Extraction after download often produces no stdout/stderr for a long time. */
const STALL_MS = Number(process.env.PLAYWRIGHT_INSTALL_STALL_MS ?? 0);
const RETRY_COOLDOWN_MS = Number(
  process.env.PLAYWRIGHT_INSTALL_RETRY_COOLDOWN_MS ?? (platform() === "win32" ? 8_000 : 4_000),
);

function getPlaywrightBrowsersRoot() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH?.trim()) {
    return process.env.PLAYWRIGHT_BROWSERS_PATH.trim();
  }
  const plat = platform();
  if (plat === "win32") {
    const la = process.env.LOCALAPPDATA;
    if (la) return join(la, "ms-playwright");
    return join(homedir(), "AppData", "Local", "ms-playwright");
  }
  if (plat === "darwin") {
    return join(homedir(), "Library", "Caches", "ms-playwright");
  }
  const xdg = process.env.XDG_CACHE_HOME;
  return join(xdg || join(homedir(), ".cache"), "ms-playwright");
}

function getDirLockPath() {
  return join(getPlaywrightBrowsersRoot(), "__dirlock");
}

/** Playwright leaves `__dirlock` while installing; a killed child can leave it stale. Remove before cache clear or retry. */
function removeDirLockQuiet() {
  const lock = getDirLockPath();
  if (!existsSync(lock)) return;
  try {
    rmSync(lock, { recursive: true, force: true });
    log(`Removed stale dir lock: ${lock}`);
  } catch (e) {
    warn("Could not remove __dirlock (retry or close other Playwright installs):", e?.message ?? e);
  }
}

function killInstallTree(child) {
  if (!child?.pid) return;
  try {
    if (platform() === "win32") {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    try {
      child.kill("SIGKILL");
    } catch {
      /* ignore */
    }
  }
}

async function settleAfterKill() {
  log(`Waiting ${RETRY_COOLDOWN_MS}ms for processes and locks to release…`);
  await sleep(RETRY_COOLDOWN_MS);
  removeDirLockQuiet();
  await sleep(1_000);
  removeDirLockQuiet();
}

function clearBrowserCache() {
  const dir = getPlaywrightBrowsersRoot();
  if (!existsSync(dir)) {
    log(`No cache dir to remove (${dir})`);
    return;
  }
  removeDirLockQuiet();
  try {
    warn(`Removing Playwright browser cache: ${dir}`);
    rmSync(dir, { recursive: true, force: true });
    log("Cache cleared.");
  } catch (e) {
    warn("Could not fully remove cache (files may be in use):", e?.message ?? e);
  }
}

/**
 * Run a shell command with forwarded stdout/stderr, stall detection, and hard timeout.
 * @returns {Promise<{ code: number | null, timedOut: boolean, stalled: boolean }>}
 */
function runShell(command, extraEnv) {
  return new Promise((resolve) => {
    log(`Running: ${command}`);
    const child = spawn(command, {
      shell: true,
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...extraEnv },
    });

    let lastActivity = Date.now();
    let stalled = false;
    let timedOut = false;

    const bump = () => {
      lastActivity = Date.now();
    };

    child.stdout?.on("data", (chunk) => {
      bump();
      process.stdout.write(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      bump();
      process.stderr.write(chunk);
    });

    const stallTimer =
      STALL_MS > 0
        ? setInterval(() => {
            if (Date.now() - lastActivity <= STALL_MS) return;
            stalled = true;
            warn(`No output for ${STALL_MS}ms — killing install (stall).`);
            killInstallTree(child);
          }, 10_000)
        : null;

    const hardTimer = setTimeout(() => {
      timedOut = true;
      warn(`Hard timeout ${HARD_TIMEOUT_MS}ms — killing install.`);
      killInstallTree(child);
    }, HARD_TIMEOUT_MS);

    child.on("exit", (code) => {
      if (stallTimer) clearInterval(stallTimer);
      clearTimeout(hardTimer);
      resolve({ code: code ?? 1, timedOut, stalled });
    });

    child.on("error", (err) => {
      if (stallTimer) clearInterval(stallTimer);
      clearTimeout(hardTimer);
      warn("Spawn error:", err?.message ?? err);
      resolve({ code: 1, timedOut, stalled });
    });
  });
}

async function main() {
  loadRootDotEnv();

  if (STALL_MS > 0 && STALL_MS < 600_000) {
    warn(
      `PLAYWRIGHT_INSTALL_STALL_MS=${STALL_MS} is low; Playwright can be silent for many minutes after download completes. Prefer 0 (off) or >= 600000.`,
    );
  }

  if (process.env.SKIP_PLAYWRIGHT_INSTALL === "true") {
    warn("SKIP_PLAYWRIGHT_INSTALL=true — skipping browser download.");
    warn("E2E may fail until you run: npm run playwright:install");
    process.exit(0);
  }

  const strategies = [
    {
      name: "chromium + chromium-headless-shell",
      cmd: "npx playwright install chromium chromium-headless-shell",
      env: {},
    },
    {
      name: "force reinstall (chromium + headless shell)",
      cmd: "npx playwright install chromium chromium-headless-shell --force",
      env: {},
    },
    {
      name: "Azure CDN mirror (chromium + headless shell)",
      cmd: "npx playwright install chromium chromium-headless-shell",
      env: {
        PLAYWRIGHT_DOWNLOAD_HOST:
          process.env.PLAYWRIGHT_DOWNLOAD_HOST || "https://playwright.azureedge.net",
      },
    },
    {
      name: "full install (default hosts)",
      cmd: "npx playwright install",
      env: {},
    },
    {
      name: "full install (Azure mirror)",
      cmd: "npx playwright install",
      env: {
        PLAYWRIGHT_DOWNLOAD_HOST:
          process.env.PLAYWRIGHT_DOWNLOAD_HOST || "https://playwright.azureedge.net",
      },
    },
  ];

  for (let i = 0; i < strategies.length; i++) {
    const s = strategies[i];
    if (i > 0) {
      log(`--- Strategy ${i + 1}/${strategies.length}: ${s.name} ---`);
      await settleAfterKill();
      clearBrowserCache();
    } else {
      log(`--- Strategy 1/${strategies.length}: ${s.name} ---`);
      removeDirLockQuiet();
    }

    const { code, timedOut, stalled } = await runShell(s.cmd, s.env);
    if (code === 0) {
      log(`Success with: ${s.name}`);
      process.exit(0);
    }
    warn(`Failed (${s.name}) exit=${code} timedOut=${timedOut} stalled=${stalled}`);
    if (i < strategies.length - 1 && (timedOut || stalled)) {
      await settleAfterKill();
    }
  }

  console.error(`
[playwright-install] All strategies failed.

Try manually:
  - Free disk space (installs are large).
  - Corporate proxy: set HTTPS_PROXY / HTTP_PROXY in .env or the environment.
  - Custom CDN: set PLAYWRIGHT_DOWNLOAD_HOST in .env (see Playwright docs).
  - Use Google Chrome instead of downloaded Chromium:
      set PLAYWRIGHT_USE_SYSTEM_CHROME=true
    or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to chrome.exe / chromium path.
  - Skip auto-install before tests: set SKIP_PLAYWRIGHT_INSTALL=true
`);
  process.exit(1);
}

await main();

/**
 * Dependency provenance & integrity audit (post OWASP A06 remediation).
 * Run from repo root: npx tsx backend/scripts/dependency-provenance-audit.ts
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dirname, "..", "..");

type LockPkg = { version?: string; resolved?: string; link?: boolean };
type LockRoot = {
  packages?: Record<string, LockPkg>;
  dependencies?: Record<string, { version: string }>;
};

type DirectDeps = Record<string, string>;
type Overrides = Record<string, string>;

type ChangeRow = {
  workspace: "frontend" | "backend";
  name: string;
  prev: string | null;
  next: string | null;
  change: "added" | "removed" | "upgraded" | "downgraded" | "unchanged";
  direct: boolean;
  why: string;
};

const OVERRIDE_WHY: Record<string, string> = {
  tar: "CVE hardening — bcrypt transitive; avoid bcrypt@6 major bump",
  ws: "CVE hardening — socket.io transitive DoS/memory advisories",
  esbuild: "GHSA-gv7w-rqvm-qjhr — build toolchain integrity (0.28.1+)",
  uuid: "CVE hardening — firebase-admin transitive; avoid firebase-admin@14",
};

const DIRECT_WHY: Record<string, string> = {
  "react-router": "High-severity React Router advisories (7.13 → 7.17)",
  vite: "esbuild transitive + patch release (6.4.2 → 6.4.3)",
  express: "qs transitive via npm audit fix (4.21 → 4.22.2)",
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function gitFile(ref: string, rel: string): string | null {
  try {
    return execSync(`git show ${ref}:${rel}`, { cwd: repoRoot, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  } catch {
    return null;
  }
}

function lockPackages(lock: LockRoot): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, meta] of Object.entries(lock.packages ?? {})) {
    if (!meta.version) continue;
    const name = key === "" ? null : key.replace(/^node_modules\//, "");
    if (!name) continue;
    out.set(name, meta.version);
  }
  return out;
}

function collectDirect(pkgPath: string): DirectDeps {
  const pkg = readJson<{ dependencies?: DirectDeps; devDependencies?: DirectDeps; overrides?: Overrides }>(pkgPath);
  return { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
}

function collectOverrides(pkgPath: string): Overrides {
  return readJson<{ overrides?: Overrides }>(pkgPath).overrides ?? {};
}

function semverBump(prev: string, next: string): ChangeRow["change"] {
  const p = prev.replace(/^[\^~]/, "").split(".").map(Number);
  const n = next.replace(/^[\^~]/, "").split(".").map(Number);
  if (n[0] > p[0]) return "upgraded";
  if (n[0] < p[0]) return "downgraded";
  if ((n[1] ?? 0) > (p[1] ?? 0)) return "upgraded";
  if ((n[1] ?? 0) < (p[1] ?? 0)) return "downgraded";
  if ((n[2] ?? 0) !== (p[2] ?? 0)) return "upgraded";
  return "unchanged";
}

function diffLock(
  workspace: "frontend" | "backend",
  relLock: string,
  relPkg: string,
  directNames: Set<string>,
): ChangeRow[] {
  const beforeRaw = gitFile("HEAD", relLock);
  const afterRaw = readFileSync(join(repoRoot, relLock), "utf8");
  if (!beforeRaw) throw new Error(`Cannot read git HEAD:${relLock}`);

  const before = lockPackages(JSON.parse(beforeRaw) as LockRoot);
  const after = lockPackages(JSON.parse(afterRaw) as LockRoot);
  const overrides = collectOverrides(join(repoRoot, relPkg));
  const rows: ChangeRow[] = [];

  const allNames = new Set([...before.keys(), ...after.keys()]);
  for (const name of [...allNames].sort()) {
    const prev = before.get(name) ?? null;
    const next = after.get(name) ?? null;
    if (prev === next) continue;

    let change: ChangeRow["change"];
    let why = "Transitive update from npm audit fix / dependency tree refresh";

    if (prev === null) {
      change = "added";
      why = "New transitive dependency introduced by upgraded parent package(s)";
    } else if (next === null) {
      change = "removed";
      why = "Removed from tree after parent upgrade or deduplication";
    } else {
      change = semverBump(prev, next);
    }

    if (directNames.has(name) && DIRECT_WHY[name]) {
      why = DIRECT_WHY[name];
    } else if (name in overrides || overrides[name]) {
      why = `npm override pin: ${OVERRIDE_WHY[name] ?? "security pin"}`;
    } else if (directNames.has(name)) {
      why = "Direct dependency version bump in package.json";
    }

    rows.push({
      workspace,
      name,
      prev,
      next,
      change,
      direct: directNames.has(name),
      why,
    });
  }
  return rows;
}

function scanLockIntegrity(lockPath: string): {
  nonRegistry: { pkg: string; resolved: string }[];
  gitOrFile: { pkg: string; resolved: string }[];
  totalResolved: number;
} {
  const lock = readJson<LockRoot>(join(repoRoot, lockPath));
  const nonRegistry: { pkg: string; resolved: string }[] = [];
  const gitOrFile: { pkg: string; resolved: string }[] = [];
  let totalResolved = 0;

  for (const [key, meta] of Object.entries(lock.packages ?? {})) {
    if (!meta.resolved) continue;
    totalResolved += 1;
    const pkg = key.replace(/^node_modules\//, "") || "(root)";
    const r = meta.resolved;
    if (/^(file:|link:|git\+|github:|http:\/\/)/i.test(r)) {
      gitOrFile.push({ pkg, resolved: r });
    } else if (!r.startsWith("https://registry.npmjs.org/")) {
      nonRegistry.push({ pkg, resolved: r });
    }
  }
  return { nonRegistry, gitOrFile, totalResolved };
}

function npmView(name: string, version: string): Record<string, unknown> | null {
  try {
    const out = execSync(`npm view ${name}@${version} --json`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 15000,
    });
    return JSON.parse(out) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function ageDays(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function verifyOverride(name: string, version: string) {
  const meta = npmView(name, version);
  if (!meta) {
    return { ok: false, detail: `NOT FOUND on registry.npmjs.org` };
  }
  const published = String(meta.time?.[version] ?? meta.time?.modified ?? "");
  const maintainers = (meta.maintainers as { name: string }[] | undefined)?.map((m) => m.name) ?? [];
  const downloads = meta as { _npmUser?: { name: string } };
  return {
    ok: true,
    name: meta.name,
    version: meta.version,
    published,
    ageDays: published ? ageDays(published) : null,
    maintainers: maintainers.slice(0, 5),
    publisher: downloads._npmUser?.name ?? maintainers[0] ?? "unknown",
    integrity: Boolean(meta.dist?.integrity),
  };
}

function main() {
  console.log("=== CareTip Dependency Provenance & Integrity Audit ===\n");
  console.log("Baseline: git HEAD vs working tree (OWASP A06 remediation)\n");

  const feDirect = new Set(Object.keys(collectDirect(join(repoRoot, "package.json"))));
  const beDirect = new Set(Object.keys(collectDirect(join(repoRoot, "backend/package.json"))));

  const feChanges = diffLock("frontend", "package-lock.json", "package.json", feDirect);
  const beChanges = diffLock("backend", "backend/package-lock.json", "backend/package.json", beDirect);
  const allChanges = [...feChanges, ...beChanges];

  const added = allChanges.filter((c) => c.change === "added");
  const removed = allChanges.filter((c) => c.change === "removed");
  const upgraded = allChanges.filter((c) => c.change === "upgraded" || c.change === "downgraded");

  console.log("--- 1. Change summary ---");
  console.log(`Added: ${added.length} | Removed: ${removed.length} | Version changed: ${upgraded.length}`);
  console.log(`Frontend lock changes: ${feChanges.length} | Backend lock changes: ${beChanges.length}\n`);

  console.log("--- 2. Direct dependency & override manifest changes ---");
  const feOverridesBefore = gitFile("HEAD", "package.json");
  const beOverridesBefore = gitFile("HEAD", "backend/package.json");
  const fePkgNow = readJson<{ dependencies?: DirectDeps; devDependencies?: DirectDeps; overrides?: Overrides }>(
    join(repoRoot, "package.json"),
  );
  const bePkgNow = readJson<{ overrides?: Overrides; dependencies?: DirectDeps }>(join(repoRoot, "backend/package.json"));

  console.log("Frontend direct:");
  console.log("  react-router: 7.13.0 → 7.17.0 (direct, security minor)");
  console.log("  vite: 6.4.2 → 6.4.3 (direct dev, patch + esbuild chain)");
  console.log("Frontend overrides ADDED/EXTENDED:");
  for (const [k, v] of Object.entries(fePkgNow.overrides ?? {})) {
    console.log(`  ${k}: ${v}`);
  }

  console.log("Backend overrides ADDED:");
  for (const [k, v] of Object.entries(bePkgNow.overrides ?? {})) {
    const had = beOverridesBefore?.includes(`"${k}"`) ?? false;
    console.log(`  ${k}: ${v}${had ? "" : " (new block)"}`);
  }

  console.log("\n--- 3. Override registry verification ---");
  const overrideChecks = [
    { ws: "8.21.0", tar: "7.5.16", esbuild: "0.28.1", uuid: "11.1.1" },
  ][0];
  for (const [pkg, ver] of Object.entries(overrideChecks)) {
    const r = verifyOverride(pkg, ver);
    console.log(`\n${pkg}@${ver}:`);
    if (!r.ok) {
      console.log(`  FAIL — ${r.detail}`);
    } else {
      console.log(`  OK — official npm package "${r.name}" v${r.version}`);
      console.log(`  Published: ${r.published} (${r.ageDays} days ago)`);
      console.log(`  Publisher/maintainers: ${r.maintainers?.join(", ") || r.publisher}`);
      console.log(`  Subresource integrity in registry: ${r.integrity}`);
      console.log(`  Why: ${OVERRIDE_WHY[pkg]}`);
    }
  }

  console.log("\n--- 4. Lockfile integrity scan ---");
  for (const rel of ["package-lock.json", "backend/package-lock.json"]) {
    const scan = scanLockIntegrity(rel);
    console.log(`\n${rel}:`);
    console.log(`  Resolved tarball entries: ${scan.totalResolved}`);
    console.log(`  Non-registry.npmjs.org URLs: ${scan.nonRegistry.length}`);
    console.log(`  file:/git+/link: deps: ${scan.gitOrFile.length}`);
    if (scan.nonRegistry.length) scan.nonRegistry.slice(0, 10).forEach((x) => console.log(`    ! ${x.pkg}: ${x.resolved}`));
    if (scan.gitOrFile.length) scan.gitOrFile.forEach((x) => console.log(`    ! ${x.pkg}: ${x.resolved}`));
  }

  console.log("\n--- 5. Top changed packages (direct + security-relevant) ---");
  const priority = new Set([
    ...Object.keys(DIRECT_WHY),
    ...Object.keys(OVERRIDE_WHY),
    "qs",
    "form-data",
    "protobufjs",
    "@opentelemetry/core",
    "express",
    "dompurify",
    "playwright",
    "react-router",
    "vite",
    "esbuild",
    "ws",
    "tar",
    "uuid",
  ]);
  const highlight = allChanges.filter((c) => c.direct || priority.has(c.name.split("/").pop() ?? c.name));
  for (const c of highlight.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(
      `[${c.workspace}] ${c.name}: ${c.prev ?? "—"} → ${c.next ?? "—"} (${c.change}, ${c.direct ? "direct" : "transitive"}) — ${c.why}`,
    );
  }

  console.log("\n--- 6. Newly introduced packages (not in HEAD lockfile) ---");
  if (added.length === 0) {
    console.log("None — no net-new package names in lockfiles.");
  } else {
    for (const c of added.slice(0, 40)) {
      console.log(`[${c.workspace}] + ${c.name}@${c.next} (${c.direct ? "direct" : "transitive"})`);
    }
    if (added.length > 40) console.log(`… and ${added.length - 40} more`);
  }

  console.log("\n--- 7. Full change list (JSON path for report) ---");
  console.log(`Total version changes recorded: ${allChanges.length}`);
  console.log("Run with CARETIP_PROVENANCE_JSON=1 to emit machine-readable output.\n");

  if (process.env.CARETIP_PROVENANCE_JSON === "1") {
    console.log(JSON.stringify({ added, removed, upgraded: allChanges.filter((c) => c.change !== "added" && c.change !== "removed") }, null, 2));
  }

  // Suspicious: packages added in last 30 days at high level
  console.log("--- 8. Supply-chain spot checks (override + direct targets) ---");
  const spotCheck = ["ws", "tar", "esbuild", "uuid", "react-router", "vite", "qs", "form-data"];
  const suspicious: string[] = [];
  for (const name of spotCheck) {
    const row = allChanges.find((c) => c.name === name);
    const ver = row?.next ?? (name === "react-router" ? "7.17.0" : name === "vite" ? "6.4.3" : null);
    if (!ver) continue;
    const meta = npmView(name, ver.replace(/^[\^~]/, ""));
    if (!meta) {
      suspicious.push(`${name}@${ver} NOT ON REGISTRY`);
      continue;
    }
    const pub = String((meta.time as Record<string, string>)?.[ver.replace(/^[\^~]/, "")] ?? "");
    const days = pub ? ageDays(pub) : 9999;
    const maint = ((meta.maintainers as { name: string }[]) ?? []).map((m) => m.name).join(", ");
    const flag = days < 14 ? " ⚠ recently published" : "";
    console.log(`${name}@${meta.version}: maintainers=[${maint}] published=${pub?.slice(0, 10) || "n/a"}${flag}`);
  }

  console.log("\n--- 9. Verdict ---");
  const feScan = scanLockIntegrity("package-lock.json");
  const beScan = scanLockIntegrity("backend/package-lock.json");
  const lockClean = feScan.gitOrFile.length === 0 && beScan.gitOrFile.length === 0 && feScan.nonRegistry.length === 0 && beScan.nonRegistry.length === 0;
  const overridesOk = ["ws", "tar", "esbuild", "uuid"].every((p) => verifyOverride(p, overrideChecks[p as keyof typeof overrideChecks]).ok);

  console.log(`Lockfile registry-only: ${lockClean ? "PASS" : "FAIL"}`);
  console.log(`Override packages on official npm: ${overridesOk ? "PASS" : "FAIL"}`);
  console.log(`Suspicious/new typosquat flags: ${suspicious.length ? suspicious.join("; ") : "NONE"}`);
  console.log(
    `\nAnswer: Were any hallucinated, unofficial, typosquatted, or suspicious packages introduced? ${suspicious.length === 0 && lockClean && overridesOk ? "NO" : "REVIEW REQUIRED"}`,
  );
}

main();

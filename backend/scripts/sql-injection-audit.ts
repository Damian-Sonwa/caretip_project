/**
 * Static SQL injection guard for backend/src.
 * Run: npm run test:sql-injection-audit
 *
 * Scans application source (not maintenance scripts under backend/scripts/).
 * Fails CI when forbidden raw-SQL patterns are introduced.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type Violation = { file: string; line: number; reason: string };

type Allowlist = {
  files?: string[];
  violations?: Array<{ file: string; line: number; reason?: string }>;
};

const SRC_ROOT = join(process.cwd(), "src");
const ALLOWLIST_PATH = join(process.cwd(), "scripts/sql-injection-audit.allowlist.json");

const ALLOWLIST: Allowlist = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"));

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/");
}

function isAllowlistedFile(relPath: string): boolean {
  const norm = normalizePath(relPath);
  return (ALLOWLIST.files ?? []).some((f) => normalizePath(f) === norm);
}

function isAllowlistedViolation(relPath: string, line: number): boolean {
  const norm = normalizePath(relPath);
  return (ALLOWLIST.violations ?? []).some(
    (v) => normalizePath(v.file) === norm && v.line === line,
  );
}

function listSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      listSourceFiles(full, acc);
    } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

function stripComments(line: string): string {
  const noBlock = line.replace(/\/\*.*?\*\//g, "");
  const idx = noBlock.indexOf("//");
  return idx >= 0 ? noBlock.slice(0, idx) : noBlock;
}

function scanLine(relPath: string, lineNo: number, rawLine: string, violations: Violation[]): void {
  if (isAllowlistedViolation(relPath, lineNo)) return;

  const line = stripComments(rawLine);
  if (!line.trim()) return;

  if (/\$queryRawUnsafe\b/.test(line)) {
    violations.push({
      file: relPath,
      line: lineNo,
      reason: "$queryRawUnsafe is forbidden in backend/src (use Prisma.sql or tagged $queryRaw)",
    });
    return;
  }

  if (/\$executeRawUnsafe\b/.test(line)) {
    violations.push({
      file: relPath,
      line: lineNo,
      reason: "$executeRawUnsafe is forbidden in backend/src",
    });
    return;
  }

  if (/\$queryRaw\s*\(\s*['"`]/.test(line)) {
    violations.push({
      file: relPath,
      line: lineNo,
      reason: "$queryRaw called with a string literal — use Prisma.sql`...` or tagged $queryRaw`...`",
    });
    return;
  }

  if (/\$executeRaw\s*\(\s*['"`]/.test(line)) {
    violations.push({
      file: relPath,
      line: lineNo,
      reason: "$executeRaw called with a string literal — use Prisma.sql parameter binding",
    });
    return;
  }

  if (/\$queryRaw\s*\([^)]*\+/.test(line) || /\$executeRaw\s*\([^)]*\+/.test(line)) {
    violations.push({
      file: relPath,
      line: lineNo,
      reason: "String concatenation inside $queryRaw/$executeRaw — use Prisma.sql with bound parameters",
    });
    return;
  }

  const sqlKeyword =
    /\b(SELECT\s|INSERT\s+INTO\s|UPDATE\s+\w+\s+SET|DELETE\s+FROM\s|FROM\s+[a-zA-Z_"`]|\bWHERE\s+\w|\bUNION\s+SELECT\b)/i;
  const sqlConcat =
    (sqlKeyword.test(line) && /['"`]\s*\+|\+\s*['"`]/.test(line)) ||
    (/\$queryRaw|\$executeRaw|\.query\s*\(/.test(line) && /\+/.test(line));
  if (sqlConcat) {
    violations.push({
      file: relPath,
      line: lineNo,
      reason: "String-concatenated SQL detected — use Prisma ORM or Prisma.sql",
    });
    return;
  }

  if (/\b(?:pg|pool)\.query\s*\(\s*['"`]/.test(line) || /\b(?:pg|pool)\.query\s*\([^)]*\+/.test(line)) {
    violations.push({
      file: relPath,
      line: lineNo,
      reason: "Direct pg.query with string SQL — use Prisma instead",
    });
    return;
  }

  if (/\$queryRaw\s*\(\s*`[^`]*\$\{[^}]*\breq\.(query|params|body)\b/.test(line)) {
    violations.push({
      file: relPath,
      line: lineNo,
      reason: "Request input interpolated into $queryRaw(...) — bind via Prisma.sql or use findMany",
    });
  }
}

function scanFile(absPath: string): Violation[] {
  const relPath = normalizePath(relative(process.cwd(), absPath));
  if (isAllowlistedFile(relPath)) return [];

  const violations: Violation[] = [];
  const content = readFileSync(absPath, "utf8");
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    scanLine(relPath, i + 1, lines[i]!, violations);
  }

  // Multi-line: $queryRaw( without Prisma.sql on same line — check next non-empty lines
  for (let i = 0; i < lines.length; i += 1) {
    const rel = normalizePath(relative(process.cwd(), absPath));
    const lineNo = i + 1;
    if (isAllowlistedViolation(rel, lineNo)) continue;

    const line = stripComments(lines[i]!);
    if (!/\$queryRaw\s*\(\s*$/.test(line.trim()) && !/\$queryRaw\s*\(\s*[^P`]/.test(line)) {
      continue;
    }
    if (/Prisma\.sql/.test(line)) continue;

    let j = i;
    let window = line;
    while (j < Math.min(i + 6, lines.length - 1) && !window.includes(");")) {
      j += 1;
      window += ` ${stripComments(lines[j]!)}`;
    }
    if (/\$queryRaw\s*\(\s*Prisma\.sql/.test(window)) continue;
    if (/\$queryRaw\s*`/.test(window)) continue;

    if (/\$queryRaw\s*\(/.test(line) && !/\$queryRaw\s*`/.test(window)) {
      violations.push({
        file: rel,
        line: lineNo,
        reason: "$queryRaw(...) must wrap SQL in Prisma.sql`...` or use tagged prisma.$queryRaw`...`",
      });
    }
  }

  return violations;
}

function main(): void {
  const files = listSourceFiles(SRC_ROOT);
  const allViolations: Violation[] = [];

  for (const file of files) {
    allViolations.push(...scanFile(file));
  }

  console.log("=== SQL injection static audit (backend/src) ===\n");
  console.log(`Scanned ${files.length} file(s) under src/\n`);

  if (allViolations.length === 0) {
    console.log("PASS: No forbidden raw-SQL patterns found.");
    console.log("\nOVERALL: PASS");
    process.exit(0);
  }

  console.log(`FAIL: ${allViolations.length} violation(s):\n`);
  for (const v of allViolations) {
    console.log(`${v.file}:${v.line}`);
    console.log(`  ${v.reason}\n`);
  }
  console.log("OVERALL: FAIL");
  process.exit(1);
}

main();

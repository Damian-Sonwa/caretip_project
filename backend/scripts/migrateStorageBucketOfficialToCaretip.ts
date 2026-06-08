/**
 * Copies objects from misnamed bucket "caretip official" → public bucket "caretip".
 * Run after fixing SUPABASE_STORAGE_BUCKET=caretip on Render.
 *
 *   npm run storage:migrate-official-bucket --prefix backend
 *   npm run storage:migrate-official-bucket -- --dry-run
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { normalizeSupabasePublicStorageUrl } from "../src/utils/normalizeSupabaseStorageUrl.js";

const SOURCE = "caretip official";
const TARGET = "caretip";
const dryRun = process.argv.includes("--dry-run");

function projectUrl(): string | undefined {
  const raw = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;
  const m = raw.match(/https?:\/\/[a-z0-9-]+\.supabase\.co/i);
  return m?.[0];
}

const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE?.trim();
const url = projectUrl();
if (!url || !key) {
  console.error("Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const prisma = new PrismaClient();

async function listAllUnderPrefix(bucket: string, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
  for (const entry of data ?? []) {
    if (!entry.name || entry.name === ".emptyFolderPlaceholder") continue;
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id == null && !entry.metadata) {
      const nested = await listAllUnderPrefix(bucket, path);
      keys.push(...nested);
    } else {
      keys.push(path);
    }
  }
  return keys;
}

async function copyObject(objectKey: string): Promise<void> {
  const { data: blob, error: dlErr } = await supabase.storage.from(SOURCE).download(objectKey);
  if (dlErr || !blob) throw new Error(`download ${objectKey}: ${dlErr?.message ?? "empty"}`);

  const buf = Buffer.from(await blob.arrayBuffer());
  const contentType = blob.type || "application/octet-stream";

  if (dryRun) {
    console.log(`[dry-run] would copy ${objectKey} (${buf.length} bytes)`);
    return;
  }

  const { error: upErr } = await supabase.storage.from(TARGET).upload(objectKey, buf, {
    contentType,
    upsert: true,
    cacheControl: "3600",
  });
  if (upErr) throw new Error(`upload ${objectKey}: ${upErr.message}`);
  console.log(`[copy] ${objectKey}`);
}

function rewriteStoredUrl(stored: string): string | null {
  const trimmed = stored.trim();
  if (!trimmed) return null;
  const normalized = normalizeSupabasePublicStorageUrl(trimmed);
  if (normalized !== trimmed) return normalized;
  if (trimmed.includes(SOURCE) || trimmed.includes("caretip%20official")) {
    return trimmed
      .replace(/caretip%20official/gi, TARGET)
      .replace(/caretip official/gi, TARGET);
  }
  return null;
}

async function syncDatabaseUrls(): Promise<void> {
  let n = 0;
  const businesses = await prisma.business.findMany({
    where: { logoPath: { not: null } },
    select: { id: true, logoPath: true },
  });
  for (const b of businesses) {
    const next = rewriteStoredUrl(b.logoPath!);
    if (!next || next === b.logoPath) continue;
    if (!dryRun) await prisma.business.update({ where: { id: b.id }, data: { logoPath: next } });
    console.log(`[db] business ${b.id} logo_path updated`);
    n += 1;
  }

  const employees = await prisma.employee.findMany({
    where: { avatar: { not: null } },
    select: { id: true, avatar: true },
  });
  for (const e of employees) {
    const next = rewriteStoredUrl(e.avatar!);
    if (!next || next === e.avatar) continue;
    if (!dryRun) await prisma.employee.update({ where: { id: e.id }, data: { avatar: next } });
    console.log(`[db] employee ${e.id} avatar updated`);
    n += 1;
  }
  console.log(`[db] ${dryRun ? "would update" : "updated"} ${n} row(s)`);
}

async function main() {
  console.log(`project: ${url}`);
  console.log(`migrate: "${SOURCE}" → "${TARGET}"${dryRun ? " (dry-run)" : ""}`);

  const prefixes = ["business-logos", "employee-avatars", "platform"];
  const allKeys = new Set<string>();
  for (const p of prefixes) {
    try {
      for (const k of await listAllUnderPrefix(SOURCE, p)) allKeys.add(k);
    } catch (e) {
      console.warn(String(e));
    }
  }

  console.log(`found ${allKeys.size} object(s) in "${SOURCE}"`);
  for (const key of [...allKeys].sort()) {
    await copyObject(key);
  }

  await syncDatabaseUrls();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

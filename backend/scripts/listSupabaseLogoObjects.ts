/**
 * Lists logo objects in Supabase Storage (service role). Usage:
 *   npm run storage:list-logos --prefix backend
 */
import { createClient } from "@supabase/supabase-js";

function projectUrl(): string | undefined {
  const raw = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;
  const m = raw.match(/https?:\/\/[a-z0-9-]+\.supabase\.co/i);
  return m?.[0];
}

const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE?.trim();
const url = projectUrl();
if (!url || !key) {
  console.error("Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const buckets = ["caretip", "caretip official"];
const prefix = "business-logos";

async function listBucket(bucket: string) {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 20 });
  if (error) {
    console.log(`\n[${bucket}] list error:`, error.message);
    return;
  }
  console.log(`\n[${bucket}] ${prefix}/ (${data?.length ?? 0} items shown, max 20)`);
  for (const f of data ?? []) {
    console.log(`  - ${f.name}`);
  }
}

async function probe(bucket: string, objectKey: string) {
  const { error } = await supabase.storage.from(bucket).download(objectKey);
  console.log(`  download ${bucket}/${objectKey}: ${error ? error.message : "OK"}`);
}

async function main() {
  console.log("project:", url);
  for (const b of buckets) await listBucket(b);
  const sample = "business-logos/1780498382773-StockCake-standard-10000645665-1779271372852.png";
  console.log("\nProbe sample object:");
  for (const b of buckets) await probe(b, sample);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

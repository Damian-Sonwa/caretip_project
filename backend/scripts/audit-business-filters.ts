import "../src/loadEnv.js";
import { listPlatformBusinesses } from "../src/services/platformBusinessList.service.js";
import { getAllBusinessActivity } from "../src/services/platform.service.js";

async function main() {
  const all = await getAllBusinessActivity();
  console.log("Unfiltered businesses:", all.length);

  const cases: Array<{ label: string; params: Parameters<typeof listPlatformBusinesses>[0] }> = [
    { label: "default page", params: { take: 25, skip: 0 } },
    { label: "verified", params: { take: 25, skip: 0, status: "verified" } },
    { label: "awaiting_upload", params: { take: 25, skip: 0, status: "awaiting_upload" } },
    { label: "pending_review", params: { take: 25, skip: 0, status: "pending_review" } },
    { label: "today", params: { take: 25, skip: 0, datePreset: "today" } },
    { label: "tips zero", params: { take: 25, skip: 0, tips: "zero" } },
    { label: "tips 1_500", params: { take: 25, skip: 0, tips: "1_500" } },
    { label: "verified + tips zero", params: { take: 25, skip: 0, status: "verified", tips: "zero" } },
  ];

  for (const { label, params } of cases) {
    const r = await listPlatformBusinesses(params);
    console.log(`${label}: total=${r.total} items=${r.items.length}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => process.exit());

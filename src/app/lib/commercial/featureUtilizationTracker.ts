export type CommercialFeatureKey =
  | "qr_studio"
  | "qr_analytics"
  | "analytics_page"
  | "performance_page"
  | "csv_export"
  | "branding"
  | "employee_goals"
  | "multi_location"
  | "table_qr";

const pending = new Set<CommercialFeatureKey>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_MS = 4000;

/** Map business dashboard pathname segments to commercial feature keys. */
export function featureKeysForPathname(pathname: string): CommercialFeatureKey[] {
  const path = pathname.replace(/\/+$/, "");
  const keys: CommercialFeatureKey[] = [];

  if (path.includes("/dashboard/tips/analytics")) keys.push("analytics_page");
  if (path.includes("/dashboard/team/performance")) keys.push("performance_page");
  if (path.includes("/dashboard/qr-studio")) keys.push("qr_studio");
  if (path.includes("/dashboard/settings") && path.includes("branding")) keys.push("branding");

  return keys;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushFeatureUtilization();
  }, FLUSH_MS);
}

export function queueFeatureUtilization(keys: CommercialFeatureKey[]) {
  if (keys.length === 0) return;
  for (const k of keys) pending.add(k);
  scheduleFlush();
}

export function recordFeatureUtilizationNow(featureKey: CommercialFeatureKey) {
  pending.add(featureKey);
  void flushFeatureUtilization();
}

async function flushFeatureUtilization() {
  if (pending.size === 0) return;
  const featureKeys = [...pending];
  pending.clear();

  try {
    const { postCommercialFeatureUtilization } = await import("../api");
    await postCommercialFeatureUtilization(featureKeys);
  } catch {
    // Best-effort telemetry — never block UX
  }
}

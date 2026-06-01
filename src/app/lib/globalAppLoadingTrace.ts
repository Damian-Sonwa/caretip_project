const LOADER_MOUNT_LABELS: Record<string, string> = {
  "app-boot": "Bootstrap Loader",
  "app-auth-bootstrap": "Auth Loader Mounted",
  "auth-page": "Auth Loader Mounted",
  "onboarding-init": "Onboarding Loader Mounted",
  "business-shell": "Dashboard Shell Loader Mounted",
  "employee-shell": "Dashboard Shell Loader Mounted",
  "business-dashboard-paint": "Dashboard Loader Mounted",
  "employee-dashboard-paint": "Dashboard Loader Mounted",
};

function labelForKey(key: string): string {
  if (LOADER_MOUNT_LABELS[key]) return LOADER_MOUNT_LABELS[key];
  if (key.startsWith("protected-route-session:")) return "Auth Loader Mounted";
  if (key.startsWith("protected-route-guard:")) return "Route Loader Mounted";
  if (key.endsWith("-chunk")) return "Route Loader Mounted";
  return `[${key}]`;
}

export function traceGlobalLoaderBlocking(key: string, priority: number): void {
  if (!import.meta.env.DEV) return;
  console.info(`[GlobalAppLoading] ${labelForKey(key)} — blocking (p${priority})`);
}

export function traceGlobalLoaderReady(key: string): void {
  if (!import.meta.env.DEV) return;
  console.info(`[GlobalAppLoading] ${labelForKey(key)} — ready`);
}

export function traceGlobalOverlayMounted(): void {
  if (!import.meta.env.DEV) return;
  console.info("[GlobalAppLoading] Global App Loader Mounted");
}

export function traceGlobalOverlayDismissed(): void {
  if (!import.meta.env.DEV) return;
  console.info("[GlobalAppLoading] Global App Loader Dismissed");
}

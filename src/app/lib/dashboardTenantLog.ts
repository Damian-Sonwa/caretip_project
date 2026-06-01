import { getAuthUser } from "./authUserStore";

/** Dev-only tenant trace for dashboard API calls. */
export function logDashboardTenantRequest(
  scope: string,
  meta?: Record<string, unknown>,
): void {
  if (!import.meta.env.DEV) return;
  const user = getAuthUser();
  console.info(`[CareTip:tenant] ${scope}`, {
    userId: user?.id ?? null,
    businessId: user?.businessId ?? null,
    employeeId: user?.employeeId ?? null,
    role: user?.role ?? null,
    ...meta,
  });
}

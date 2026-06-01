type DashboardTenantMeta = {
  userId?: string | null;
  businessId?: string | null;
  employeeId?: string | null;
  role?: string | null;
  route?: string;
  [key: string]: unknown;
};

/** Dev / ops trace — never log tokens or PII beyond IDs. */
export function logDashboardTenant(label: string, meta: DashboardTenantMeta): void {
  if (process.env.NODE_ENV === "test") return;
  console.info(`[dashboard:tenant] ${label}`, meta);
}

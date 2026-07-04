/** Prefetch lazy authenticated dashboard chunks on hover/focus/idle — faster post-login navigation. */

type RouteImporter = () => Promise<unknown>;

const AUTHENTICATED_ROUTE_IMPORTERS: Record<string, RouteImporter> = {
  "/dashboard": () => import("../pages/business/BusinessDashboard"),
  "/employee/dashboard": () => import("../pages/employee/EmployeeDashboard"),
  "/platform-admin/dashboard": () => import("../components/AdminDashboard"),
  "/login": () => import("../components/AuthPage"),
  "/signup": () => import("../components/AuthPage"),
  "/employee/login": () => import("../components/AuthPage"),
};

const prefetched = new Set<string>();

export function prefetchAuthenticatedRoute(path: string): void {
  const normalized = path.split("#")[0].split("?")[0];
  if (!normalized || prefetched.has(normalized)) return;
  const factory = AUTHENTICATED_ROUTE_IMPORTERS[normalized];
  if (!factory) return;
  prefetched.add(normalized);
  void factory();
}

/** Warm business + employee dashboard shells after auth surfaces idle. */
export function prefetchDashboardRoutes(): void {
  prefetchAuthenticatedRoute("/dashboard");
  prefetchAuthenticatedRoute("/employee/dashboard");
}

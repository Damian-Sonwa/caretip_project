import { navFlashLog } from "./navigationFlashAudit";

/** Customer entry routes: never show error/not-found while loading or redirecting. */
export type CustomerEntryPhase = "loading" | "redirecting" | "ready" | "error";

export function isCustomerEntryPending(phase: CustomerEntryPhase): boolean {
  return phase === "loading" || phase === "redirecting";
}

export function shouldShowCustomerEntryFailure(
  phase: CustomerEntryPhase,
  opts: { error: string | null; hasContent: boolean },
): boolean {
  if (isCustomerEntryPending(phase)) return false;
  return Boolean(opts.error) || !opts.hasContent;
}

export function scheduleCustomerRouteRedirect(
  to: string,
  navigate: (to: string, opts?: { replace?: boolean }) => void,
  opts?: { replace?: boolean; from?: string },
): void {
  navFlashLog("redirect_scheduled", { path: opts?.from, to, replace: opts?.replace ?? false });
  navigate(to, { replace: opts?.replace });
  navFlashLog("redirect_executed", { path: opts?.from, to, replace: opts?.replace ?? false });
}

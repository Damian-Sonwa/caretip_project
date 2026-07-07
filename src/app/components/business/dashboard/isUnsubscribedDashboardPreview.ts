import {
  isEntitlementsSessionPrimed,
  sessionHasActiveEntitlements,
} from "@/app/lib/subscriptionEntitlementFastPath";

/** True only when the business has no entitled access (exceptional — not internal Basic). */
export function isUnsubscribedDashboardPreview(
  entitlementsReady: boolean,
  hasActiveEntitlements: boolean,
): boolean {
  if (entitlementsReady) return !hasActiveEntitlements;
  if (isEntitlementsSessionPrimed()) return !sessionHasActiveEntitlements();
  return false;
}

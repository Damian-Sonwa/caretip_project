import {
  isEntitlementsSessionPrimed,
  sessionHasActiveEntitlements,
} from "@/app/lib/subscriptionEntitlementFastPath";

/** True when the business has no operational subscription/sponsored access (dashboard preview mode). */
export function isUnsubscribedDashboardPreview(
  entitlementsReady: boolean,
  hasActiveEntitlements: boolean,
): boolean {
  if (entitlementsReady) return !hasActiveEntitlements;
  if (isEntitlementsSessionPrimed()) return !sessionHasActiveEntitlements();
  return false;
}

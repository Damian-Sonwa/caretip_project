import type { FeatureKey } from "@/app/lib/subscriptionCapabilities";
import { minimumTierForFeature } from "@/app/lib/subscriptionCapabilities";
import {
  isEntitlementsSessionPrimed,
  sessionHasActiveEntitlements,
  sessionHasFeature,
} from "@/app/lib/subscriptionEntitlementFastPath";

export type SidebarNavLockReason = "none" | "activation_required" | "upgrade_required";

export type SidebarNavEntitlementView = {
  ready: boolean;
  hasActiveEntitlements: boolean;
  hasFeature: (featureKey: FeatureKey) => boolean;
};

const ALWAYS_OPEN_PREFIXES = ["/dashboard/billing", "/dashboard/settings"] as const;

const SUBSCRIPTION_MODULE_PREFIXES = [
  "/dashboard/qr-studio",
  "/dashboard/customers",
  "/dashboard/team",
  "/dashboard/tips",
] as const;

const GROUP_ACTIVATION_FEATURE: Record<string, FeatureKey> = {
  "qr-studio": "employeeQr",
  team: "teamManagement",
  customers: "customerFeedback",
  tips: "tipManagement",
};

function hrefRequiresSubscriptionModule(href: string): boolean {
  return SUBSCRIPTION_MODULE_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`),
  );
}

function isAlwaysOpenHref(href: string): boolean {
  if (href === "/dashboard") return true;
  return ALWAYS_OPEN_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`) || href.startsWith(`${prefix}?`),
  );
}

export function resolveSidebarNavEntitlements(
  entitlements: SidebarNavEntitlementView,
): SidebarNavEntitlementView {
  if (entitlements.ready) return entitlements;
  if (!isEntitlementsSessionPrimed()) {
    return {
      ready: false,
      hasActiveEntitlements: false,
      hasFeature: () => false,
    };
  }
  return {
    ready: true,
    hasActiveEntitlements: sessionHasActiveEntitlements(),
    hasFeature: sessionHasFeature,
  };
}

export function resolveSidebarNavLock(
  href: string,
  featureKey: FeatureKey | undefined,
  groupId: string | undefined,
  entitlements: SidebarNavEntitlementView,
): {
  locked: boolean;
  reason: SidebarNavLockReason;
  dialogFeatureKey: FeatureKey;
} {
  const view = resolveSidebarNavEntitlements(entitlements);
  const dialogFeatureKey =
    featureKey ?? (groupId ? GROUP_ACTIVATION_FEATURE[groupId] : undefined) ?? "tipManagement";

  if (isAlwaysOpenHref(href)) {
    return { locked: false, reason: "none", dialogFeatureKey };
  }

  if (!view.hasActiveEntitlements && hrefRequiresSubscriptionModule(href)) {
    return { locked: true, reason: "activation_required", dialogFeatureKey };
  }

  if (featureKey && view.hasActiveEntitlements && !view.hasFeature(featureKey)) {
    return { locked: true, reason: "upgrade_required", dialogFeatureKey: featureKey };
  }

  return { locked: false, reason: "none", dialogFeatureKey };
}

export function planLabelKeyForFeature(featureKey: FeatureKey): string {
  const tier = minimumTierForFeature(featureKey);
  if (tier === "enterprise") return "dashboardNav.business.planLabels.enterprise";
  if (tier === "premium") return "dashboardNav.business.planLabels.business";
  return "dashboardNav.business.planLabels.starter";
}

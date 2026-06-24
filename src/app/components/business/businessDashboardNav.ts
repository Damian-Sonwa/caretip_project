import type { CareIconName } from "@/components/icons";
import {
  hasFeature,
  type BusinessSubscriptionTier,
  type FeatureKey,
} from "@/app/lib/subscriptionCapabilities";

export const BUSINESS_DASHBOARD_HOME_HREF = "/dashboard" as const;

export type BusinessDashboardNavItem = {
  labelKey: string;
  href: string;
  icon: CareIconName;
  /** When set, show lock icon on basic tier — page still reachable for upgrade UX. */
  featureKey?: FeatureKey;
};

/** Product-centric primary navigation (SaaS IA). */
export const businessDashboardNavItems: readonly BusinessDashboardNavItem[] = [
  { labelKey: "dashboardNav.business.overview", href: "/dashboard", icon: "overview" },
  { labelKey: "dashboardNav.business.tips", href: "/dashboard/tips", icon: "tipsActivity" },
  { labelKey: "dashboardNav.business.team", href: "/dashboard/team", icon: "team" },
  {
    labelKey: "dashboardNav.business.qrStudio",
    href: "/dashboard/qr-studio",
    icon: "tableQr",
    featureKey: "tableQr",
  },
  { labelKey: "dashboardNav.business.locations", href: "/dashboard/locations", icon: "locations" },
  { labelKey: "dashboardNav.business.customers", href: "/dashboard/customers", icon: "inbox" },
  { labelKey: "dashboardNav.business.billing", href: "/dashboard/billing", icon: "billing" },
  { labelKey: "dashboardNav.business.settings", href: "/dashboard/settings", icon: "settings" },
] as const;

export const QR_STUDIO_BASE = "/dashboard/qr-studio" as const;

export const qrStudioSubNavItems = [
  { labelKey: "business.qrStudio.nav.gallery", href: `${QR_STUDIO_BASE}/gallery` },
  { labelKey: "business.qrStudio.nav.employees", href: `${QR_STUDIO_BASE}/employees` },
  { labelKey: "business.qrStudio.nav.locations", href: `${QR_STUDIO_BASE}/locations` },
  { labelKey: "business.qrStudio.nav.tables", href: `${QR_STUDIO_BASE}/tables`, featureKey: "tableQr" as FeatureKey },
  { labelKey: "business.qrStudio.nav.branding", href: `${QR_STUDIO_BASE}/branding`, featureKey: "brandingCustomization" as FeatureKey },
  { labelKey: "business.qrStudio.nav.downloads", href: `${QR_STUDIO_BASE}/downloads` },
] as const;

export const TIPS_BASE = "/dashboard/tips" as const;
export const tipsSubNavItems = [
  { labelKey: "business.tips.nav.live", href: `${TIPS_BASE}/live` },
  { labelKey: "business.tips.nav.transactions", href: `${TIPS_BASE}/transactions` },
  { labelKey: "business.tips.nav.analytics", href: `${TIPS_BASE}/analytics` },
] as const;

export const TEAM_BASE = "/dashboard/team" as const;
export const teamSubNavItems = [
  { labelKey: "business.team.nav.employees", href: `${TEAM_BASE}/employees` },
  { labelKey: "business.team.nav.performance", href: `${TEAM_BASE}/performance` },
  { labelKey: "business.team.nav.topPerformers", href: `${TEAM_BASE}/top-performers`, featureKey: "advancedAnalytics" as FeatureKey },
] as const;

export const CUSTOMERS_BASE = "/dashboard/customers" as const;
export const customersSubNavItems = [
  { labelKey: "business.customers.nav.feedback", href: `${CUSTOMERS_BASE}/feedback` },
  { labelKey: "business.customers.nav.reviews", href: `${CUSTOMERS_BASE}/reviews` },
] as const;

export const BILLING_BASE = "/dashboard/billing" as const;
export const billingSubNavItems = [
  { labelKey: "business.billing.nav.subscription", href: `${BILLING_BASE}/subscription` },
  { labelKey: "business.billing.nav.invoices", href: `${BILLING_BASE}/invoices` },
  { labelKey: "business.billing.nav.paymentMethods", href: `${BILLING_BASE}/payment-methods` },
  { labelKey: "business.billing.nav.history", href: `${BILLING_BASE}/history` },
] as const;

export function isBusinessNavItemLocked(
  item: Pick<BusinessDashboardNavItem, "featureKey">,
  tier: BusinessSubscriptionTier | undefined | null,
): boolean {
  if (!item.featureKey) return false;
  return !hasFeature(tier, item.featureKey);
}

/** @deprecated Use full nav list + isBusinessNavItemLocked — items are no longer hidden. */
export function filterBusinessDashboardNavItems(
  items: readonly BusinessDashboardNavItem[],
  _tier: BusinessSubscriptionTier | undefined | null,
): BusinessDashboardNavItem[] {
  return [...items];
}

const BUSINESS_SETTINGS_LEGACY_PATHS = ["/dashboard/profile", "/dashboard/profile-settings"] as const;

const MODULE_PREFIXES = [
  "/dashboard/tips",
  "/dashboard/team",
  "/dashboard/qr-studio",
  "/dashboard/customers",
  "/dashboard/billing",
] as const;

export function isBusinessDashboardNavActive(href: string, pathname: string): boolean {
  if (href === BUSINESS_DASHBOARD_HOME_HREF) return pathname === BUSINESS_DASHBOARD_HOME_HREF;
  if (href === "/dashboard/settings") {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      (BUSINESS_SETTINGS_LEGACY_PATHS as readonly string[]).includes(pathname)
    );
  }
  for (const prefix of MODULE_PREFIXES) {
    if (href === prefix) {
      return pathname === prefix || pathname.startsWith(`${prefix}/`);
    }
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** QR Studio KYC lock — same path family as legacy qr-code-management. */
export const QR_STUDIO_GALLERY_HREF = `${QR_STUDIO_BASE}/gallery` as const;

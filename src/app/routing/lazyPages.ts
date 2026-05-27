import { lazy, type ComponentType } from "react";

function lazyNamed<M extends Record<string, ComponentType<unknown>>>(
  factory: () => Promise<M>,
  exportName: keyof M & string,
) {
  return lazy(() => factory().then((mod) => ({ default: mod[exportName] as ComponentType<unknown> })));
}

function lazyDefault(factory: () => Promise<{ default: ComponentType<unknown> }>) {
  return lazy(factory);
}

// —— Business dashboard ——
export const BusinessDashboard = lazyNamed(
  () => import("../pages/business/BusinessDashboard"),
  "BusinessDashboard",
);
export const StaffManagementPage = lazyNamed(
  () => import("../pages/business/StaffManagementPage"),
  "StaffManagementPage",
);
export const QRCodeManagementPage = lazyNamed(
  () => import("../pages/business/QRCodeManagementPage"),
  "QRCodeManagementPage",
);
export const LocationsPage = lazyNamed(() => import("../pages/business/LocationsPage"), "LocationsPage");
export const TablesPage = lazyNamed(() => import("../pages/business/TablesPage"), "TablesPage");
export const BusinessSettingsPage = lazyNamed(
  () => import("../pages/business/BusinessSettingsPage"),
  "BusinessSettingsPage",
);
export const BusinessOnboardingPage = lazyNamed(
  () => import("../pages/BusinessOnboardingPage"),
  "BusinessOnboardingPage",
);

// —— Employee dashboard ——
export const EmployeeDashboard = lazyNamed(
  () => import("../pages/employee/EmployeeDashboard"),
  "EmployeeDashboard",
);
export const EmployeeNotificationsPage = lazyNamed(
  () => import("../pages/employee/EmployeeNotificationsPage"),
  "EmployeeNotificationsPage",
);
export const EmployeeSettingsPage = lazyNamed(
  () => import("../pages/employee/EmployeeSettingsPage"),
  "EmployeeSettingsPage",
);
export const EmployeeTipGoalsPage = lazyNamed(
  () => import("../pages/employee/EmployeeTipGoalsPage"),
  "EmployeeTipGoalsPage",
);

// —— Platform admin ——
export const AdminDashboard = lazyNamed(() => import("../components/AdminDashboard"), "AdminDashboard");
export const BusinessVerificationPage = lazyNamed(
  () => import("../pages/platform/BusinessVerificationPage"),
  "BusinessVerificationPage",
);
export const BusinessDetailPage = lazyNamed(
  () => import("../pages/platform/BusinessDetailPage"),
  "BusinessDetailPage",
);
export const GlobalTransactionsPage = lazyNamed(
  () => import("../pages/platform/GlobalTransactionsPage"),
  "GlobalTransactionsPage",
);
export const AuditLogsPage = lazyNamed(() => import("../pages/platform/AuditLogsPage"), "AuditLogsPage");
export const PlatformSettingsPage = lazyNamed(
  () => import("../pages/platform/PlatformSettingsPage"),
  "PlatformSettingsPage",
);
export const PlatformUserManagementPage = lazyNamed(
  () => import("../pages/platform/PlatformUserManagementPage"),
  "PlatformUserManagementPage",
);
export const PlatformAnnouncementsPage = lazyNamed(
  () => import("../pages/platform/PlatformAnnouncementsPage"),
  "PlatformAnnouncementsPage",
);

// —— Shared authenticated pages ——
export const NotificationInboxPage = lazyNamed(
  () => import("../pages/shared/NotificationInboxPage"),
  "NotificationInboxPage",
);
export const TipsActivityPage = lazyNamed(
  () => import("../pages/shared/TipsActivityPage"),
  "TipsActivityPage",
);
export const TransactionsPage = lazyNamed(
  () => import("../components/TransactionsPage"),
  "TransactionsPage",
);

// —— Customer tipping flow ——
export const QRLandingPage = lazyNamed(() => import("../pages/customer/QRLandingPage"), "QRLandingPage");
export const StaffLandingPage = lazyNamed(
  () => import("../pages/customer/StaffLandingPage"),
  "StaffLandingPage",
);
export const TipAmountPage = lazyNamed(() => import("../pages/customer/TipAmountPage"), "TipAmountPage");
export const PaymentPage = lazyNamed(() => import("../pages/customer/PaymentPage"), "PaymentPage");
export const SuccessPage = lazyNamed(() => import("../pages/customer/SuccessPage"), "SuccessPage");
export const RatingPage = lazyNamed(() => import("../pages/customer/RatingPage"), "RatingPage");
export const BusinessStaffDirectoryPage = lazyNamed(
  () => import("../pages/customer/BusinessStaffDirectoryPage"),
  "BusinessStaffDirectoryPage",
);
export const StaffTipByPublicPathPage = lazyNamed(
  () => import("../pages/customer/StaffTipByPublicPathPage"),
  "StaffTipByPublicPathPage",
);
export const LocationQrLandingPage = lazyNamed(
  () => import("../pages/customer/LocationQrLandingPage"),
  "LocationQrLandingPage",
);
export const TableQrLandingPage = lazyNamed(
  () => import("../pages/customer/TableQrLandingPage"),
  "TableQrLandingPage",
);
export const EmployeeQrEntryPage = lazyNamed(
  () => import("../pages/customer/EmployeeQrEntryPage"),
  "EmployeeQrEntryPage",
);

// —— Heavy demo routes (dev/marketing) ——
export const HeroSectionDemoPage = lazyDefault(() => import("../pages/HeroSectionDemoPage"));
export const HeroAnimationDemoPage = lazyNamed(
  () => import("../pages/HeroAnimationDemoPage"),
  "HeroAnimationDemoPage",
);
export const SaasDashboard3DHeroPage = lazyDefault(() => import("../pages/SaasDashboard3DHeroPage"));

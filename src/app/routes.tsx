import React, { useEffect, useLayoutEffect, useRef } from 'react';
import {
  createBrowserRouter,
  RouteObject,
  useRouteError,
  isRouteErrorResponse,
  Navigate,
  Outlet,
  useLocation,
  useNavigation,
  useParams,
} from "react-router";
import { ScrollToTop } from "./components/ScrollToTop";
import {
  useAppLoadingCoordinator,
  useMarkAppShellReadyOptional,
} from "./context/AppLoadingSplashContext";
import { RouteChunkBoundary } from "./routing/RouteChunkBoundary";
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { CookiesPage } from './pages/CookiesPage';
import { ContactPage } from './pages/ContactPage';
import { CareersPage } from './pages/CareersPage';
import { BlogPage } from './pages/BlogPage';
import { HelpPage } from './pages/HelpPage';
import { FAQPage } from './pages/FAQPage';
import { MobileAppPage } from './pages/MobileAppPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { JoinPage } from './pages/JoinPage';
import { AuthPage } from './components/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ActivateEmployeePage } from './pages/ActivateEmployeePage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { CheckEmailPage } from './pages/CheckEmailPage';
import { PlatformAdminRoute } from './components/PlatformAdminRoute';
import { PlatformAdminLoginPage } from './pages/platform/PlatformAdminLoginPage';
import {
  AdminDashboard,
  AuditLogsPage,
  BusinessDetailPage,
  BusinessOnboardingPage,
  BusinessSettingsPage,
  BusinessStaffDirectoryPage,
  BusinessVerificationPage,
  EmployeeDashboard,
  EmployeeNotificationsPage,
  EmployeeQrEntryPage,
  EmployeeSettingsPage,
  EmployeeTipGoalsPage,
  GlobalTransactionsPage,
  HeroAnimationDemoPage,
  HeroSectionDemoPage,
  LocationQrLandingPage,
  NotificationInboxPage,
  PaymentPage,
  PlatformAnnouncementsPage,
  PlatformSettingsPage,
  PlatformUserManagementPage,
  QRCodeManagementPage,
  QRLandingPage,
  RatingPage,
  SaasDashboard3DHeroPage,
  StaffLandingPage,
  StaffManagementPage,
  StaffTipByPublicPathPage,
  SuccessPage,
  TableQrLandingPage,
  TablesPage,
  TipAmountPage,
  TipsActivityPage,
  BusinessDashboard,
  LocationsPage,
} from './routing/lazyPages';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { BusinessLayout } from './layouts/BusinessLayout';
import { EmployeeLayout } from './layouts/EmployeeLayout';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ApprovedBusinessGate } from './components/ApprovedBusinessGate';
import { PendingVerificationAllowedGate } from './components/PendingVerificationAllowedGate';
import { PendingVerification } from './components/PendingVerification';
import { logClientError } from './lib/clientLog';
import { DashboardDevDebugOverlayRoot } from './components/dashboard/DashboardDevDebugOverlayRoot';

/** Canonical alias: `/qr/business/:id` → existing `/qr-landing/:id` (no behavior change). */
function RedirectQrBusiness() {
  const { businessId } = useParams<{ businessId: string }>();
  if (!businessId?.trim()) return <Navigate to="/" replace />;
  return <Navigate to={`/qr-landing/${businessId}`} replace />;
}

/** Legacy team directory path → canonical `/{businessSlug}`. */
function RedirectLegacyBusinessDirectory() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const s = businessSlug?.trim();
  if (!s) return <Navigate to="/" replace />;
  return <Navigate to={`/${encodeURIComponent(s)}`} replace />;
}

// Error boundary: never show HTTP codes or raw error details
function ErrorBoundary() {
  const error = useRouteError();
  const markShellReady = useMarkAppShellReadyOptional();
  useLayoutEffect(() => {
    markShellReady?.();
  }, [markShellReady]);

  useEffect(() => {
    logClientError('RouteErrorBoundary', error);
  }, [error]);
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const title = is404 ? "Page not found" : "This page couldn’t load";
  const message = is404
    ? "The page you're looking for doesn't exist or may have been moved."
    : "Navigation hit an unexpected problem. Go home and try again, or refresh if you were in the middle of something.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-foreground">{title}</h1>
        <p className="mb-6 text-muted-foreground">{message}</p>
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}

function RootLayout() {
  const navigation = useNavigation();
  const location = useLocation();
  const { markAppShellReady, setRouteTransitionPending } = useAppLoadingCoordinator();
  const routeSigRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    markAppShellReady();
  }, [markAppShellReady]);

  /** Single branded “route transition” overlay — not for in-route data fetching. */
  useLayoutEffect(() => {
    // Disable global route-transition spinner overlay.
    // We use a single, consistent loader via ProtectedRoute / page-level loaders instead.
    setRouteTransitionPending(false);
  }, [setRouteTransitionPending]);

  return (
    <>
      <ScrollToTop />
      <RouteChunkBoundary variant="minimal">
        <Outlet />
      </RouteChunkBoundary>
      {import.meta.env.DEV ? <DashboardDevDebugOverlayRoot /> : null}
    </>
  );
}

const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
  {
    path: '/',
    Component: LandingPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/create-rule',
    element: <Navigate to="/" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/create-skill',
    element: <Navigate to="/" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/auth',
    Component: AuthPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/login',
    Component: AuthPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business/login',
    Component: AuthPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/employee/login',
    Component: AuthPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute allowedRoles={['business']}>
        <BusinessOnboardingPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/get-started',
    element: <Navigate to="/auth?mode=signup&role=business&from=landing" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/join',
    Component: JoinPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/join/:code',
    Component: JoinPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/signup',
    Component: AuthPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/forgot-password',
    Component: ForgotPasswordPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/reset-password/:token',
    Component: ResetPasswordPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/activate',
    Component: ActivateEmployeePage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/verify-email',
    Component: CheckEmailPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/check-email',
    element: <Navigate to="/verify-email" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/verify',
    Component: VerifyEmailPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/pricing',
    Component: PricingPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/unauthorized',
    Component: UnauthorizedPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/verification-pending',
    element: (
      <ProtectedRoute allowedRoles={['business']}>
        <PendingVerificationAllowedGate />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [{ index: true, Component: PendingVerification }],
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['business']}>
        <ApprovedBusinessGate />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <BusinessLayout />,
        children: [
      { index: true, Component: BusinessDashboard },
      { path: 'settings', Component: BusinessSettingsPage },
      { path: 'profile', element: <Navigate to="/dashboard/settings?section=business" replace /> },
      { path: 'staff-management', Component: StaffManagementPage },
      { path: 'qr-code-management', Component: QRCodeManagementPage },
      { path: 'locations', Component: LocationsPage },
      { path: 'tables', Component: TablesPage },
      { path: 'transactions', Component: TipsActivityPage },
      { path: 'profile-settings', element: <Navigate to="/dashboard/settings?section=general" replace /> },
      { path: 'support', element: <Navigate to="/dashboard" replace /> },
      { path: 'notifications', Component: NotificationInboxPage },
      { path: 'subscriptions', element: <Navigate to="/dashboard/transactions" replace /> },
      { path: 'customers', element: <Navigate to="/dashboard" replace /> },
      { path: 'analytics', element: <Navigate to="/dashboard" replace /> },
      { path: 'products', element: <Navigate to="/dashboard" replace /> },
      { path: 'reports', element: <Navigate to="/dashboard" replace /> },
      { path: 'billing', element: <Navigate to="/dashboard/transactions" replace /> },
      { path: 'subscription-plans', element: <Navigate to="/pricing" replace /> },
      { path: 'subscription-billing', element: <Navigate to="/dashboard/transactions" replace /> },
        ],
      },
    ],
  },
  {
    path: '/platform-admin/login',
    Component: PlatformAdminLoginPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/platform-admin/signup',
    element: <Navigate to="/platform-admin/login" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/platform-admin',
    element: (
      <PlatformAdminRoute>
        <SuperAdminLayout />
      </PlatformAdminRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { path: 'dashboard', Component: AdminDashboard },
      { path: 'businesses', Component: BusinessVerificationPage },
      { path: 'businesses/:id', Component: BusinessDetailPage },
      { path: 'transactions', Component: GlobalTransactionsPage },
      { path: 'logs', Component: AuditLogsPage },
      { path: 'settings', Component: PlatformSettingsPage },
      { path: 'users', Component: PlatformUserManagementPage },
      { path: 'notifications', Component: NotificationInboxPage },
      { path: 'announcements', Component: PlatformAnnouncementsPage },
      { index: true, element: <Navigate to="/platform-admin/dashboard" replace /> },
    ],
  },
  {
    path: '/admin',
    element: <Navigate to="/platform-admin/dashboard" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/admin/transactions',
    element: <Navigate to="/platform-admin/transactions" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/admin/verification',
    element: <Navigate to="/platform-admin/businesses" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/admin/users',
    element: <Navigate to="/platform-admin/users" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/admin/subscriptions',
    element: <Navigate to="/platform-admin/dashboard" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/admin/settings',
    element: <Navigate to="/platform-admin/settings" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/admin/notifications',
    element: <Navigate to="/platform-admin/announcements" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/admin/activity',
    element: <Navigate to="/platform-admin/logs" replace />,
    errorElement: <ErrorBoundary />,
  },
  // Legal & Company Pages
  {
    path: '/privacy',
    Component: PrivacyPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/terms',
    Component: TermsPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/cookies',
    Component: CookiesPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/contact',
    Component: ContactPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/careers',
    Component: CareersPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/blog',
    Component: BlogPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/help',
    Component: HelpPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/faq',
    Component: FAQPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/mobile-app',
    Component: MobileAppPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/features',
    Component: FeaturesPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/how-it-works',
    Component: HowItWorksPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/hero-demo',
    Component: HeroSectionDemoPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/hero-animation-demo',
    Component: HeroAnimationDemoPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/saas-3d-hero',
    Component: SaasDashboard3DHeroPage,
    errorElement: <ErrorBoundary />,
  },
  // Customer Flow Pages
  {
    path: '/staff/:slug',
    Component: StaffLandingPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/qr/business/:businessId',
    Component: RedirectQrBusiness,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/qr/employee/:employeeId',
    Component: EmployeeQrEntryPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/qr/location/:locationId',
    Component: LocationQrLandingPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/qr/table/:tableId',
    Component: TableQrLandingPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/qr-landing/:businessId?',
    Component: QRLandingPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/table/:qrSlug',
    Component: QRLandingPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/select-employee',
    element: <Navigate to="/" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/tip-amount',
    Component: TipAmountPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/payment',
    Component: PaymentPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/success',
    Component: SuccessPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/rating',
    Component: RatingPage,
    errorElement: <ErrorBoundary />,
  },
  // Employee Dashboard Pages (staff only) — shared shell for walkthrough ribbon
  {
    path: '/employee',
    element: (
      <ProtectedRoute allowedRoles={['employee']}>
        <EmployeeLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/employee/dashboard" replace /> },
      { path: 'dashboard', Component: EmployeeDashboard },
      { path: 'transactions', Component: TipsActivityPage },
      { path: 'notifications', Component: EmployeeNotificationsPage },
      { path: 'inbox', Component: NotificationInboxPage },
      { path: 'tip-goals', Component: EmployeeTipGoalsPage },
      { path: 'settings', Component: EmployeeSettingsPage },
    ],
  },
  {
    path: '/employee-dashboard',
    element: <Navigate to="/employee/dashboard" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business/dashboard',
    element: <Navigate to="/dashboard" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business/dashboard/staff-management',
    element: <Navigate to="/dashboard/staff-management" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business/dashboard/qr-code-management',
    element: <Navigate to="/dashboard/qr-code-management" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business/dashboard/locations',
    element: <Navigate to="/dashboard/locations" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business/dashboard/tables',
    element: <Navigate to="/dashboard/tables" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business/qr-management',
    element: <Navigate to="/dashboard/qr-code-management" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business-dashboard',
    element: <Navigate to="/dashboard" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business-dashboard/staff-management',
    element: <Navigate to="/dashboard/staff-management" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business-dashboard/qr-code-management',
    element: <Navigate to="/dashboard/qr-code-management" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business-dashboard/locations',
    element: <Navigate to="/dashboard/locations" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business-dashboard/tables',
    element: <Navigate to="/dashboard/tables" replace />,
    errorElement: <ErrorBoundary />,
  },
  // Public business team QR (Path B) — must stay below /business/dashboard* static routes
  {
    path: '/business/:businessSlug',
    Component: RedirectLegacyBusinessDirectory,
    errorElement: <ErrorBoundary />,
  },
  // Canonical public slug routes (must stay last so static paths win over params)
  {
    path: '/:businessSlug/:employeeSlug',
    Component: StaffTipByPublicPathPage,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/:businessSlug',
    Component: BusinessStaffDirectoryPage,
    errorElement: <ErrorBoundary />,
  },
    ],
  },
];

export const router = createBrowserRouter(routes);

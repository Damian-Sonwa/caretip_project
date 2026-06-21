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
import { AuthBootstrapLoadingRegistrar } from "./components/AuthBootstrapLoadingRegistrar";
import {
  useAppLoadingCoordinator,
  useMarkAppShellReadyOptional,
} from "./context/AppLoadingSplashContext";
import { RouteChunkBoundary } from "./routing/RouteChunkBoundary";
import {
  routeLazy,
  routeLazyDefault,
  businessLayoutLazy,
  employeeLayoutLazy,
  authPageLazy,
  joinPageLazy,
  forgotPasswordPageLazy,
  resetPasswordPageLazy,
  activateEmployeePageLazy,
  verifyEmailPageLazy,
  checkEmailPageLazy,
  platformAdminLoginPageLazy,
  unauthorizedPageLazy,
} from './routing/routeLazy';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ApprovedBusinessGate } from './components/ApprovedBusinessGate';
import { PendingVerificationAllowedGate } from './components/PendingVerificationAllowedGate';
import { PendingVerification } from './components/PendingVerification';
import { logClientError } from './lib/clientLog';
import { DashboardDevDebugOverlayRoot } from './components/dashboard/DashboardDevDebugOverlayRoot';
import { LoaderDiagRuntime } from './components/LoaderDiagRuntime';

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
      {import.meta.env.DEV ? <LoaderDiagRuntime /> : null}
      <ScrollToTop />
      <AuthBootstrapLoadingRegistrar>
        <RouteChunkBoundary variant="minimal" registrationKey="root-route">
          <Outlet />
        </RouteChunkBoundary>
      </AuthBootstrapLoadingRegistrar>
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
    lazy: async () => {
      const { LandingPage } = await import('./pages/LandingPage');
      return { Component: LandingPage };
    },
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
    lazy: authPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/login',
    lazy: authPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/business/login',
    element: <Navigate to="/login" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/employee/login',
    lazy: authPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/onboarding',
    lazy: async () => {
      const { BusinessOnboardingPage } = await import('./pages/BusinessOnboardingPage');
      function OnboardingRoute() {
        return (
          <ProtectedRoute allowedRoles={['business']}>
            <BusinessOnboardingPage />
          </ProtectedRoute>
        );
      }
      return { Component: OnboardingRoute };
    },
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/get-started',
    element: <Navigate to="/signup" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/join',
    lazy: joinPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/join/signup',
    lazy: authPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/join/:code',
    lazy: joinPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/signup',
    lazy: authPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/forgot-password',
    lazy: forgotPasswordPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/reset-password/:token',
    lazy: resetPasswordPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/activate',
    lazy: activateEmployeePageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/verify-email',
    lazy: checkEmailPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/check-email',
    element: <Navigate to="/verify-email" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/verify',
    lazy: verifyEmailPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/pricing',
    lazy: routeLazy(() => import('./pages/PricingPage'), 'PricingPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/unauthorized',
    lazy: unauthorizedPageLazy,
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
        lazy: businessLayoutLazy,
        children: [
      { index: true, lazy: routeLazy(() => import('./pages/business/BusinessDashboard'), 'BusinessDashboard') },
      { path: 'settings', lazy: routeLazy(() => import('./pages/business/BusinessSettingsPage'), 'BusinessSettingsPage') },
      { path: 'profile', element: <Navigate to="/dashboard/settings?section=business" replace /> },
      { path: 'staff-management', lazy: routeLazy(() => import('./pages/business/StaffManagementPage'), 'StaffManagementPage') },
      { path: 'qr-code-management', lazy: routeLazy(() => import('./pages/business/QRCodeManagementPage'), 'QRCodeManagementPage') },
      { path: 'locations', lazy: routeLazy(() => import('./pages/business/LocationsPage'), 'LocationsPage') },
      { path: 'tables', lazy: routeLazy(() => import('./pages/business/TablesPage'), 'TablesPage') },
      { path: 'transactions', lazy: routeLazy(() => import('./pages/shared/TipsActivityPage'), 'TipsActivityPage') },
      { path: 'customer-feedback', lazy: routeLazy(() => import('./pages/business/CustomerFeedbackPage'), 'CustomerFeedbackPage') },
      { path: 'profile-settings', element: <Navigate to="/dashboard/settings?section=general" replace /> },
      { path: 'support', lazy: routeLazy(() => import('./pages/business/BusinessSupportPage'), 'BusinessSupportPage') },
      { path: 'support/:ticketId', lazy: routeLazy(() => import('./pages/shared/SupportTicketDetailPage'), 'SupportTicketDetailPage') },
      { path: 'notifications', lazy: routeLazy(() => import('./pages/shared/NotificationInboxPage'), 'NotificationInboxPage') },
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
    lazy: platformAdminLoginPageLazy,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/platform-admin/signup',
    element: <Navigate to="/platform-admin/login" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/platform-admin',
    lazy: async () => {
      const [{ PlatformAdminRoute }, { SuperAdminLayout }] = await Promise.all([
        import('./components/PlatformAdminRoute'),
        import('./layouts/SuperAdminLayout'),
      ]);
      function PlatformAdminShell() {
        return (
          <PlatformAdminRoute>
            <SuperAdminLayout />
          </PlatformAdminRoute>
        );
      }
      return { Component: PlatformAdminShell };
    },
    errorElement: <ErrorBoundary />,
    children: [
      { path: 'dashboard', lazy: routeLazy(() => import('./components/AdminDashboard'), 'AdminDashboard') },
      { path: 'businesses', lazy: routeLazy(() => import('./pages/platform/BusinessVerificationPage'), 'BusinessVerificationPage') },
      { path: 'businesses/:id', lazy: routeLazy(() => import('./pages/platform/BusinessDetailPage'), 'BusinessDetailPage') },
      { path: 'transactions', lazy: routeLazy(() => import('./pages/platform/GlobalTransactionsPage'), 'GlobalTransactionsPage') },
      { path: 'logs', lazy: routeLazy(() => import('./pages/platform/AuditLogsPage'), 'AuditLogsPage') },
      { path: 'settings', lazy: routeLazy(() => import('./pages/platform/PlatformSettingsPage'), 'PlatformSettingsPage') },
      { path: 'users', lazy: routeLazy(() => import('./pages/platform/PlatformUserManagementPage'), 'PlatformUserManagementPage') },
      { path: 'notifications', lazy: routeLazy(() => import('./pages/shared/NotificationInboxPage'), 'NotificationInboxPage') },
      { path: 'support/:ticketId', lazy: routeLazy(() => import('./pages/shared/SupportTicketDetailPage'), 'SupportTicketDetailPage') },
      { path: 'announcements', lazy: routeLazy(() => import('./pages/platform/PlatformAnnouncementsPage'), 'PlatformAnnouncementsPage') },
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
    lazy: routeLazy(() => import('./pages/PrivacyPage'), 'PrivacyPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/terms',
    lazy: routeLazy(() => import('./pages/TermsPage'), 'TermsPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/cookies',
    lazy: routeLazy(() => import('./pages/CookiesPage'), 'CookiesPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/contact',
    lazy: routeLazy(() => import('./pages/ContactPage'), 'ContactPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/careers',
    lazy: routeLazy(() => import('./pages/CareersPage'), 'CareersPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/blog',
    lazy: routeLazy(() => import('./pages/BlogPage'), 'BlogPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/help',
    lazy: routeLazy(() => import('./pages/HelpPage'), 'HelpPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/faq',
    lazy: routeLazy(() => import('./pages/FAQPage'), 'FAQPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/mobile-app',
    lazy: routeLazy(() => import('./pages/MobileAppPage'), 'MobileAppPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/features',
    lazy: routeLazy(() => import('./pages/FeaturesPage'), 'FeaturesPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/how-it-works',
    lazy: routeLazy(() => import('./pages/HowItWorksPage'), 'HowItWorksPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/hero-demo',
    lazy: routeLazyDefault(() => import('./pages/HeroSectionDemoPage')),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/hero-animation-demo',
    lazy: routeLazy(() => import('./pages/HeroAnimationDemoPage'), 'HeroAnimationDemoPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/saas-3d-hero',
    lazy: routeLazyDefault(() => import('./pages/SaasDashboard3DHeroPage')),
    errorElement: <ErrorBoundary />,
  },
  // Customer Flow Pages
  {
    path: '/staff/:slug',
    lazy: routeLazy(() => import('./pages/customer/StaffLandingPage'), 'StaffLandingPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/qr/business/:businessId',
    Component: RedirectQrBusiness,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/qr/employee/:employeeId',
    lazy: routeLazy(() => import('./pages/customer/EmployeeQrEntryPage'), 'EmployeeQrEntryPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/qr/location/:locationId',
    lazy: routeLazy(() => import('./pages/customer/LocationQrLandingPage'), 'LocationQrLandingPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/qr/table/:tableId',
    lazy: routeLazy(() => import('./pages/customer/TableQrLandingPage'), 'TableQrLandingPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/qr-landing/:businessId?',
    lazy: routeLazy(() => import('./pages/customer/QRLandingPage'), 'QRLandingPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/table/:qrSlug',
    lazy: routeLazy(() => import('./pages/customer/QRLandingPage'), 'QRLandingPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/select-employee',
    element: <Navigate to="/" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/tip-amount',
    lazy: routeLazy(() => import('./pages/customer/TipAmountPage'), 'TipAmountPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/payment',
    lazy: routeLazy(() => import('./pages/customer/PaymentPage'), 'PaymentPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/success',
    lazy: routeLazy(() => import('./pages/customer/SuccessPage'), 'SuccessPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/rating',
    lazy: routeLazy(() => import('./pages/customer/RatingPage'), 'RatingPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/tip-complete',
    lazy: routeLazy(() => import('./pages/customer/TipCompletionPage'), 'TipCompletionPage'),
    errorElement: <ErrorBoundary />,
  },
  // Employee Dashboard Pages (staff only) — shared shell for walkthrough ribbon
  {
    path: '/employee',
    element: (
      <ProtectedRoute allowedRoles={['employee']}>
        <Outlet />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        lazy: employeeLayoutLazy,
        children: [
          { index: true, element: <Navigate to="/employee/dashboard" replace /> },
          { path: 'dashboard', lazy: routeLazy(() => import('./pages/employee/EmployeeDashboard'), 'EmployeeDashboard') },
          { path: 'tip-history', lazy: routeLazy(() => import('./pages/employee/EmployeeTipHistoryPage'), 'EmployeeTipHistoryPage') },
          { path: 'notifications', element: <Navigate to="/employee/tip-history" replace /> },
          { path: 'transactions', element: <Navigate to="/employee/tip-history" replace /> },
          { path: 'inbox', lazy: routeLazy(() => import('./pages/shared/NotificationInboxPage'), 'NotificationInboxPage') },
          { path: 'tip-goals', lazy: routeLazy(() => import('./pages/employee/EmployeeTipGoalsPage'), 'EmployeeTipGoalsPage') },
          { path: 'settings', lazy: routeLazy(() => import('./pages/employee/EmployeeSettingsPage'), 'EmployeeSettingsPage') },
        ],
      },
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
    lazy: routeLazy(() => import('./pages/customer/StaffTipByPublicPathPage'), 'StaffTipByPublicPathPage'),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/:businessSlug',
    lazy: routeLazy(() => import('./pages/customer/BusinessStaffDirectoryPage'), 'BusinessStaffDirectoryPage'),
    errorElement: <ErrorBoundary />,
  },
    ],
  },
];

export const router = createBrowserRouter(routes);

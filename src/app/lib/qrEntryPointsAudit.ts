/**
 * QR ENTRY POINTS — implementation audit (read before changing routes)
 *
 * Employee (canonical slug path)
 * - Routes: `/{businessSlug}/{employeeSlug}` → StaffTipByPublicPathPage; API
 *   `GET /api/staff/directory/business/:businessSlug/employee/:employeeSlug`
 * - Legacy: `/staff/:slug` → StaffLandingPage; API `GET /api/staff/:slug` (global employee slug)
 * - Legacy id: `/qr/employee/:employeeId` → EmployeeQrEntryPage; API `GET /api/employees/:id` (public)
 * - QR: branded PNG uses `publicEmployeeTipUrl(businessSlug, employeeSlug)` from appPublicUrl.ts
 *
 * Business / team directory
 * - Routes: `/{businessSlug}` → BusinessStaffDirectoryPage; legacy redirect from `/business/:slug`
 * - API: `GET /api/staff/directory/business/:slug`
 * - Alternate: `/qr-landing/:businessId` when venue has no slug yet
 * - QR: storefront uses `businessDirectoryUrl` / `publicBusinessTipUrl` when `business.slug` is set
 *
 * Table
 * - Routes: `/table/:qrSlug` → QRLandingPage (slug); `/qr/table/:tableId` → TableQrLandingPage
 * - QR: management uses `qrTableUrl(tableId)`
 *
 * Location
 * - Routes: `/qr/location/:locationId` → LocationQrLandingPage
 * - QR: `qrLocationUrl(locationId)`
 *
 * Canonical aliases (non-breaking)
 * - `/qr/business/:businessId` → redirects to `/qr-landing/:businessId`
 *
 * Admin QR generation (dashboard → QR code management)
 * - All URLs: `src/app/lib/appPublicUrl.ts` — production: set `BASE_URL` (see `vite.config.ts` + README)
 */

export {};

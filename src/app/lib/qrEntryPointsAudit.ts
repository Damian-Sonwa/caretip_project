/**
 * QR ENTRY POINTS — implementation audit (read before changing routes)
 *
 * Employee (stable id)
 * - Routes: `/qr/employee/:employeeId` → EmployeeQrEntryPage; API `GET /api/employees/:id` (public)
 * - QR: branded PNG + management UI use `VITE_APP_URL` / `NEXT_PUBLIC_APP_URL` + `/qr/employee/:id`
 *
 * Business / team directory
 * - Routes: `/business/:businessSlug` → BusinessStaffDirectoryPage; API `GET /api/staff/directory/business/:slug`
 * - Alternate: `/qr-landing/:businessId` → QRLandingPage; `/qr/business/:id` → redirect to qr-landing
 * - QR: storefront encodes env-based `qrLandingUrl` / `businessDirectoryUrl`
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
 * - All URLs: `src/app/lib/appPublicUrl.ts` (never raw localhost in production when env is set)
 */

export {};

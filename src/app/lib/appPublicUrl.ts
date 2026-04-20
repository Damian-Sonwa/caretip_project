/**
 * Public web app base URL for links and QR payloads (never the API host).
 * Set in production: VITE_APP_URL or NEXT_PUBLIC_APP_URL (see vite.config envPrefix).
 * When unset in the browser, falls back to window.location.origin (local dev).
 */

function readEnvBase(): string {
  const vite = import.meta.env.VITE_APP_URL;
  const next = import.meta.env.NEXT_PUBLIC_APP_URL;
  for (const raw of [vite, next]) {
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim().replace(/\/+$/, "");
    }
  }
  return "";
}

/** Absolute origin for customer-facing URLs and QR codes. */
export function getAppPublicBaseUrl(): string {
  const fromEnv = readEnvBase();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function joinPath(path: string): string {
  const base = getAppPublicBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** /qr/employee/:employeeId — guest scan → tip flow */
export function qrEmployeeUrl(employeeId: string): string {
  return joinPath(`/qr/employee/${encodeURIComponent(employeeId)}`);
}

/** /qr/location/:locationId */
export function qrLocationUrl(locationId: string): string {
  return joinPath(`/qr/location/${encodeURIComponent(locationId)}`);
}

/** /qr/table/:tableId */
export function qrTableUrl(tableId: string): string {
  return joinPath(`/qr/table/${encodeURIComponent(tableId)}`);
}

/** /qr/business/:businessId (redirects to qr-landing) */
export function qrBusinessUrl(businessId: string): string {
  return joinPath(`/qr/business/${encodeURIComponent(businessId)}`);
}

/** /qr-landing/:businessId — storefront / team picker when no slug */
export function qrLandingUrl(businessId: string): string {
  return joinPath(`/qr-landing/${encodeURIComponent(businessId)}`);
}

/** /business/:businessSlug — team directory (Path B) */
export function businessDirectoryUrl(businessSlug: string): string {
  return joinPath(`/business/${encodeURIComponent(businessSlug)}`);
}

/** Legacy guest link by table slug (tipping context) */
export function tableBySlugUrl(qrSlug: string): string {
  return joinPath(`/table/${encodeURIComponent(qrSlug)}`);
}

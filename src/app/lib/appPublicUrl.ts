/**
 * Public web app base URL for links and QR payloads (never the API host).
 * In the browser, defaults to `window.location.origin` so table/employee QR links match the site
 * the manager is using. Optional override: `NEXT_PUBLIC_APP_URL`, or legacy `VITE_APP_URL` if that
 * is still set on the host (must be http(s) only — pasted `.env` lines are sanitized).
 *
 * QR codes must encode **absolute** https URLs so phone cameras open the correct host (relative
 * `/qr/...` in a QR is not portable when scanned).
 */

/** Strips common copy-paste mistakes (e.g. `VITE_APP_URL=https://…` stored in the wrong field). */
function sanitizePublicSiteOrigin(raw: string): string {
  let s = raw
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/\uFF1D/g, "=")
    .replace(/\/+$/, "");
  if (!s) return "";
  const keyPrefixes = [/^VITE_APP_URL=/i, /^NEXT_PUBLIC_APP_URL=/i];
  for (let i = 0; i < 8; i++) {
    const before = s;
    for (const re of keyPrefixes) {
      if (re.test(s)) s = s.replace(re, "").trim().replace(/\/+$/, "");
    }
    if (s === before) break;
  }
  const bogusOnly = /^(VITE_APP_URL|NEXT_PUBLIC_APP_URL)$/i.test(s);
  if (bogusOnly) return "";
  s = s
    .replace(/^VITE_APP_URL(?=https?:\/\/)/i, "")
    .replace(/^NEXT_PUBLIC_APP_URL(?=https?:\/\/)/i, "")
    .replace(/^VITE_APP_URL\s+(?=https?:\/\/)/i, "")
    .replace(/^NEXT_PUBLIC_APP_URL\s+(?=https?:\/\/)/i, "")
    .trim()
    .replace(/\/+$/, "");
  const m = s.match(/https?:\/\/[^\s"'`]+/i);
  if (m && m.index !== undefined && m.index > 0) {
    s = m[0].trim().replace(/\/+$/, "");
  }
  return s;
}

/**
 * Turns a dashboard/env value into `https://host` only (no path). Handles pasted `.env` lines,
 * fullwidth `＝`, and values where the first `https://` is not at position 0.
 */
function envRawToPublicOrigin(raw: string): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  const normalizedInput = raw.replace(/^\uFEFF/, "").replace(/\uFF1D/g, "=");
  let s = sanitizePublicSiteOrigin(normalizedInput);
  if (!/^https?:\/\//i.test(s)) {
    const m = normalizedInput.match(/https?:\/\/[^\s"'`]+/i);
    if (m) s = m[0].trim().replace(/\/+$/, "");
  }
  if (!/^https?:\/\//i.test(s)) return "";
  try {
    return new URL(s).origin.replace(/\/+$/, "");
  } catch {
    const hostOnly = s.match(/^https?:\/\/[^/]+/i);
    return hostOnly ? hostOnly[0].replace(/\/+$/, "") : "";
  }
}

function readEnvBase(): string {
  /** Prefer Next-style name; `VITE_APP_URL` is legacy (some dashboards still use it for the SPA origin). */
  const candidates = [import.meta.env.NEXT_PUBLIC_APP_URL, import.meta.env.VITE_APP_URL];
  for (const raw of candidates) {
    const origin = envRawToPublicOrigin(raw);
    if (origin) return origin;
  }
  return "";
}

/** Absolute origin for customer-facing URLs and QR codes. */
export function getAppPublicBaseUrl(): string {
  const fromEnv = readEnvBase();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
}

function joinPath(path: string): string {
  const base = getAppPublicBaseUrl().replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  let out = `${base}${p}`;
  if (typeof window !== "undefined" && !/^https?:\/\//i.test(out)) {
    out = `${window.location.origin.replace(/\/+$/, "")}${p}`;
  }
  return out;
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

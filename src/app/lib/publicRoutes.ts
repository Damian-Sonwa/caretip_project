/**
 * Routes that must not block on session bootstrap for anonymous visitors.
 * Authenticated restore (stored credentials) may still show the global loader briefly
 * on protected routes — never on public marketing or auth shell paths.
 */

import { isPublicAuthenticationPath } from "./authSession";

const PUBLIC_MARKETING_EXACT = new Set([
  "/",
  "/pricing",
  "/features",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/cookies",
  "/help",
  "/blog",
  "/careers",
  "/how-it-works",
  "/mobile-app",
  "/join",
  "/get-started",
]);

const PUBLIC_MARKETING_PREFIXES = [
  "/join/",
  "/qr-landing/",
  "/qr/business/",
  "/tip/",
  "/table/",
  "/location/",
  "/staff/",
  "/rate/",
  "/payment/",
  "/success/",
  "/forgot-password",
  "/reset-password/",
  "/activate",
  "/verify",
  "/verify-email",
  "/check-email",
];

/** Guest tipping / marketing surfaces — no dashboard or onboarding init required. */
export function isPublicMarketingPath(pathname: string): boolean {
  const p = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (PUBLIC_MARKETING_EXACT.has(p)) return true;
  return PUBLIC_MARKETING_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix));
}

/**
 * Public pages that must render immediately — marketing, auth forms, guest tip flows.
 * Used to skip the global bootstrap overlay and auth-init blocking.
 */
export function isPublicShellPath(pathname: string): boolean {
  const p = pathname.split("?")[0]?.split("#")[0] ?? "/";
  return isPublicMarketingPath(p) || isPublicAuthenticationPath(p);
}

import type { AuthStatus } from "./authSession";
import { shouldSuppressSessionBootstrapOverlay } from "./authTransitionIntent";
import { hasClientSessionHint } from "./authSessionHint";
import { hasClientStoredSession } from "./authUserStore";

/**
 * Single gate for public login surfaces — wait until session bootstrap finishes
 * before rendering login forms, session-resume cards, or marketing auth chrome.
 */
export function isAuthBootstrapComplete(authStatus: AuthStatus): boolean {
  return authStatus !== "initializing";
}

/** True when startup must validate storage/cookies before painting a login form. */
export function requiresAuthBootstrapBeforeLoginPaint(): boolean {
  return hasClientStoredSession() || hasClientSessionHint();
}

/**
 * Full-page neutral shell while bootstrap runs or a post-login redirect is in flight.
 * During submit (before redirect target is chosen), keep the login form visible with its own spinner.
 */
export function shouldShowAuthBootstrapShell(options: {
  authStatus: AuthStatus;
  authTransitionPending: boolean;
  /** Cold anonymous visits may paint the form while bootstrap settles in the background. */
  allowImmediateLoginPaint?: boolean;
}): boolean {
  if (shouldSuppressSessionBootstrapOverlay()) return false;
  if (options.authTransitionPending) return true;
  if (
    options.authStatus === "initializing" &&
    options.allowImmediateLoginPaint &&
    !requiresAuthBootstrapBeforeLoginPaint()
  ) {
    return false;
  }
  if (options.authStatus === "initializing") return true;
  return false;
}

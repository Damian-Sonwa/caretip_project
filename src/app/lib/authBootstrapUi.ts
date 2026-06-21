import type { AuthStatus } from "./authSession";

/**
 * Single gate for public login surfaces — wait until session bootstrap finishes
 * before rendering login forms, session-resume cards, or marketing auth chrome.
 */
export function isAuthBootstrapComplete(authStatus: AuthStatus): boolean {
  return authStatus !== "initializing";
}

/**
 * Full-page neutral shell while bootstrap runs or a post-login redirect is in flight.
 * During submit (before redirect target is chosen), keep the login form visible with its own spinner.
 */
export function shouldShowAuthBootstrapShell(options: {
  authStatus: AuthStatus;
  authTransitionPending: boolean;
}): boolean {
  if (options.authStatus === "initializing") return true;
  if (options.authTransitionPending) return true;
  return false;
}

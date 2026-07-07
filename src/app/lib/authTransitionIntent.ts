/**
 * Single source of truth for auth transition intent.
 * Distinguishes session bootstrap from intentional logout so loaders never compete.
 */

import { isLogoutPending } from "./api";
import {
  isAuthLogoutTransitionActive,
  isPostLogoutBootstrapSuppress,
  subscribeAuthLogoutTransition,
} from "./authLogoutTransition";

export { subscribeAuthLogoutTransition, isAuthLogoutTransitionActive };

/** User clicked sign out — not cold-start session restore. */
export function isIntentionalUserLogout(): boolean {
  return (
    isAuthLogoutTransitionActive() ||
    isLogoutPending() ||
    isPostLogoutBootstrapSuppress()
  );
}

/** Block "Setting things up for you" during intentional logout. */
export function shouldSuppressSessionBootstrapOverlay(): boolean {
  return isIntentionalUserLogout();
}

/** Sidebar sign-out button — brief disabled state, no global overlay. */
export function isUserSigningOut(): boolean {
  return isAuthLogoutTransitionActive() || isLogoutPending();
}

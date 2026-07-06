import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";

/** Single global overlay while navigating away after a successful sign-in. */
export function useAuthPostLoginTransitionOverlay(active: boolean): void {
  useAppLoadingRegistration(
    "auth-post-login-transition",
    APP_LOADING_PRIORITY.AUTH,
    active,
  );
}

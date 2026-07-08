import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";

/** Registers the post-login overlay key — consumed by {@link AuthPostLoginTransitionRegistrar}. */
export function useAuthPostLoginTransitionOverlay(active: boolean, message?: string): void {
  useAppLoadingRegistration(
    "auth-post-login-transition",
    APP_LOADING_PRIORITY.AUTH,
    active,
    message,
  );
}

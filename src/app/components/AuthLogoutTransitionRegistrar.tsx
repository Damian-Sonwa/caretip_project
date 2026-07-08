import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";
import {
  isAuthLogoutTransitionActive,
  subscribeAuthLogoutTransition,
} from "../lib/authLogoutTransition";
import { resolveAppLoadingContextMessage } from "../lib/appLoadingContexts";

/**
 * Global branded overlay for intentional sign-out — survives layout unmount.
 */
export function AuthLogoutTransitionRegistrar({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const active = useSyncExternalStore(
    subscribeAuthLogoutTransition,
    isAuthLogoutTransitionActive,
    () => false,
  );

  useAppLoadingRegistration(
    "auth-logout-transition",
    APP_LOADING_PRIORITY.AUTH,
    active,
    resolveAppLoadingContextMessage("signingOut", t),
  );

  return <>{children}</>;
}

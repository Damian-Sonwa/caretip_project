import { useTranslation } from "react-i18next";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";
import type { AppLoadingPriority } from "../lib/appLoadingPriority";
import {
  resolveAppLoadingContextMessage,
  type AppLoadingContext,
} from "../lib/appLoadingContexts";

type UseAppLoadingContextOptions = {
  registrationKey: string;
  priority?: AppLoadingPriority;
  /** Explicit copy overrides context mapping. */
  message?: string;
};

/**
 * Register the global branded overlay with an action-aware message.
 * Prefer this over ad-hoc fullscreen spinners.
 */
export function useAppLoadingContext(
  context: AppLoadingContext,
  active: boolean,
  options: UseAppLoadingContextOptions,
): void {
  const { t } = useTranslation();
  const message =
    options.message ?? resolveAppLoadingContextMessage(context, t);
  useAppLoadingRegistration(
    options.registrationKey,
    options.priority ?? APP_LOADING_PRIORITY.ROUTE_GUARD,
    active,
    message,
  );
}

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "react-router";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../lib/globalAppLoading";

/**
 * Shows the global branded overlay while React Router resolves lazy route modules.
 */
export function RouteNavigationLoadingRegistrar({ children }: { children: ReactNode }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const pending = navigation.state === "loading";

  useAppLoadingRegistration(
    "route-navigation",
    APP_LOADING_PRIORITY.ROUTE_GUARD,
    pending,
    t("common.preparingWorkspace"),
  );

  return <>{children}</>;
}

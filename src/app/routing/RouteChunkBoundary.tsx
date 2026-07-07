import { Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
  useRegisterGlobalAppInit,
} from "../lib/globalAppLoading";
import {
  DashboardOutletFallback,
  DashboardOutletShellHold,
  MinimalRouteFallback,
} from "./DashboardOutletFallback";

type RouteChunkBoundaryProps = {
  children: ReactNode;
  /**
   * shell = dashboard layout outlet (height hold only; page owns skeletons)
   * dashboard = full metric skeleton (standalone / non-shell routes)
   * minimal = public route transition
   */
  variant?: "shell" | "dashboard" | "minimal";
  /** Dev trace key for lazy chunk loading under the global overlay. */
  registrationKey?: string;
};

function RouteChunkSuspenseFallback({
  variant,
  registrationKey,
}: {
  variant: "shell" | "dashboard" | "minimal";
  registrationKey: string;
}) {
  const { t } = useTranslation();
  useRegisterGlobalAppInit(
    `${registrationKey}-chunk`,
    variant === "dashboard" || variant === "minimal",
  );
  useAppLoadingRegistration(
    `${registrationKey}-shell-chunk`,
    APP_LOADING_PRIORITY.ROUTE_GUARD,
    variant === "shell",
    t("common.preparingWorkspace"),
  );

  if (variant === "minimal") {
    return <MinimalRouteFallback />;
  }
  if (variant === "shell") {
    return <DashboardOutletShellHold />;
  }
  return <DashboardOutletFallback />;
}

export function RouteChunkBoundary({
  children,
  variant = "dashboard",
  registrationKey = "route-chunk",
}: RouteChunkBoundaryProps) {
  return (
    <Suspense
      fallback={<RouteChunkSuspenseFallback variant={variant} registrationKey={registrationKey} />}
    >
      {children}
    </Suspense>
  );
}

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { isLogoutPending } from "../lib/api";
import { traceGlobalOverlayMounted } from "../lib/globalAppLoadingTrace";
import { LoadingSpinner } from "./ui/loading-spinner";

export type AppBrandedLoadingScreenProps = {
  className?: string;
  /** Full-viewport fixed overlay (global manager). */
  fixed?: boolean;
  message?: string;
  /** Fade-out when global overlay is dismissing. */
  exiting?: boolean;
};

/**
 * Global setup loader — spinner + copy only (no logo; branding lives in app chrome).
 */
export function AppBrandedLoadingScreen({
  className,
  fixed = false,
  message,
  exiting = false,
}: AppBrandedLoadingScreenProps) {
  const { t } = useTranslation();
  const resolvedMessage =
    message ?? (isLogoutPending() ? t("common.signingOut") : t("common.settingUp"));

  useEffect(() => {
    if (!fixed || exiting) return;
    traceGlobalOverlayMounted();
  }, [fixed, exiting]);

  return (
    <div
      className={cn(
        "app-setup-loading flex flex-col items-center justify-center gap-4 bg-background px-6",
        fixed ? "fixed inset-0 z-[9998]" : "min-h-[100dvh] w-full",
        exiting && "app-setup-loading--exiting",
        className,
      )}
      role="status"
      aria-busy={!exiting}
      aria-live="polite"
    >
      <LoadingSpinner size="lg" />
      <div className="flex max-w-sm flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium text-foreground">{resolvedMessage}</p>
        <p className="text-xs text-muted-foreground">{t("common.onlyAMoment")}</p>
      </div>
    </div>
  );
}

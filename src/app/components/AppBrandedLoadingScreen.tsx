import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { isLogoutPending } from "../lib/api";
import { traceGlobalOverlayMounted } from "../lib/globalAppLoadingTrace";
import { CareTipBrandLoader } from "./CareTipBrandLoader";

export type AppBrandedLoadingScreenProps = {
  className?: string;
  /** Full-viewport fixed overlay (global manager). */
  fixed?: boolean;
  message?: string;
  /** Fade-out when global overlay is dismissing. */
  exiting?: boolean;
};

/**
 * Global setup loader — CareTip wordmark + orange glow track (auth bootstrap, route gates).
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
        "app-setup-loading flex flex-col items-center justify-center bg-background px-6",
        fixed ? "fixed inset-0 z-[9998]" : "min-h-[100dvh] w-full",
        exiting && "app-setup-loading--exiting",
        className,
      )}
      role="status"
      aria-busy={!exiting}
      aria-live="polite"
      aria-label={resolvedMessage}
    >
      <CareTipBrandLoader message={resolvedMessage} />
    </div>
  );
}

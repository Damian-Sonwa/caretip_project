import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { isLogoutPending } from "../lib/api";
import { traceGlobalOverlayMounted } from "../lib/globalAppLoadingTrace";
import { CareTipBrandLoader } from "./CareTipBrandLoader";
import { CareTipLoadingOverlay } from "./CareTipLoadingOverlay";

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

  if (fixed) {
    return (
      <CareTipLoadingOverlay
        className={cn("z-[9998]", className)}
        exiting={exiting}
        seamless
        steady
        message={resolvedMessage}
        showMessage
        aria-label={resolvedMessage}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[100dvh] w-full flex-col items-center justify-center bg-background px-6",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={resolvedMessage}
    >
      <CareTipBrandLoader message={resolvedMessage} />
    </div>
  );
}

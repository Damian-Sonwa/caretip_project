import type { CareTipPageLoaderProps } from "./CareTipPageLoader";
import { CareTipPageLoader } from "./CareTipPageLoader";
import { useTranslation } from "react-i18next";
import { resolveAppLoadingContextMessage } from "../lib/appLoadingContexts";

export type PageLoaderProps = Pick<
  CareTipPageLoaderProps,
  "message" | "className" | "variant" | "context" | "registrationKey"
>;

/**
 * Registers fullscreen loading with the global branded overlay.
 * Use `variant="section"` or `"compact"` for in-dashboard placeholders.
 */
export function PageLoader({
  message,
  className,
  variant = "wait",
  context,
  registrationKey,
}: PageLoaderProps) {
  const { t } = useTranslation();
  const resolvedMessage =
    message ??
    (context ? resolveAppLoadingContextMessage(context, t) : t("common.settingUp"));
  return (
    <CareTipPageLoader
      variant={variant}
      message={resolvedMessage}
      className={className}
      registrationKey={registrationKey}
    />
  );
}

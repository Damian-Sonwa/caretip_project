import type { CareTipPageLoaderProps } from "./CareTipPageLoader";
import { CareTipPageLoader } from "./CareTipPageLoader";
import { isLogoutPending } from "../lib/api";
import { useTranslation } from "react-i18next";

export type PageLoaderProps = Pick<CareTipPageLoaderProps, "message" | "className" | "variant">;

/**
 * Inline / page-local loading UI. Auth and route gates use {@link AppLoadingManagerProvider}
 * (one fullscreen overlay). Use `variant="section"` or `"compact"` inside dashboard shells.
 */
export function PageLoader({ message, className, variant = "wait" }: PageLoaderProps) {
  const { t } = useTranslation();
  const defaultMessage = isLogoutPending() ? t("common.signingOut") : t("common.settingUp");
  return (
    <CareTipPageLoader variant={variant} message={message ?? defaultMessage} className={className} />
  );
}

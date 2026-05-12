import type { CareTipPageLoaderProps } from "./CareTipPageLoader";
import { CareTipPageLoader } from "./CareTipPageLoader";
import { useTranslation } from "react-i18next";

export type PageLoaderProps = Pick<CareTipPageLoaderProps, "message" | "className" | "variant">;

/**
 * Canonical loading UI for route gates and primary page waits.
 * Prefer this (or {@link AppLoader}) over ad-hoc spinners so auth and data hydration stay consistent.
 */
export function PageLoader({ message, className, variant = "wait" }: PageLoaderProps) {
  const { t } = useTranslation();
  return <CareTipPageLoader variant={variant} message={message ?? t("common.settingUp")} className={className} />;
}

import { useTranslation } from "react-i18next";

/** Shared a11y labels for dashboard loading shells and status regions. */
export function useDashboardShellAria() {
  const { t } = useTranslation();
  return {
    loading: t("shell.header.loadingAria"),
    loadingChart: t("shell.header.loadingChartAria"),
    status: t("shell.header.statusAria"),
  };
}

import { useTranslation } from "react-i18next";
import { QrCode } from "lucide-react";
import { businessUi } from "../businessDashboardUi";
import { cn } from "@/lib/utils";

type QrAnalyticsComingSoonProps = {
  className?: string;
  compact?: boolean;
};

/**
 * KPI trust (Sprint 1): QR scan/conversion metrics are disabled until Sprint 4
 * (`qr_scan_events` + GET /api/business/qr-analytics). See docs/KPI_SOURCE_OF_TRUTH.md.
 */
export function QrAnalyticsComingSoon({ className, compact = false }: QrAnalyticsComingSoonProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        businessUi.cardStatic,
        compact ? "px-4 py-6" : "px-6 py-10",
        "text-center",
        className,
      )}
      role="status"
    >
      <QrCode className="mx-auto mb-3 h-8 w-8 text-muted-foreground/70" aria-hidden />
      <p className="text-sm font-semibold text-foreground">{t("kpiTrust.qrAnalyticsComingSoon")}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("kpiTrust.qrAnalyticsComingSoonBody")}</p>
    </div>
  );
}

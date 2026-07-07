import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const BASIC_INCLUDED_KEYS = [
  "business.dashboard.basicStatus.features.qrTipping",
  "business.dashboard.basicStatus.features.teamManagement",
  "business.dashboard.basicStatus.features.basicDashboard",
  "business.dashboard.basicStatus.features.qrTemplates",
] as const;

type BasicPlanStatusCardProps = {
  className?: string;
};

/** Shows what Basic already includes before Pro upgrade prompts. */
export function BasicPlanStatusCard({ className }: BasicPlanStatusCardProps) {
  const { t } = useTranslation();

  return (
    <section
      className={cn("basic-plan-status-card", className)}
      aria-labelledby="basic-plan-status-title"
    >
      <h2 id="basic-plan-status-title" className="basic-plan-status-card__title">
        {t("business.dashboard.basicStatus.title")}
      </h2>
      <ul className="basic-plan-status-card__features" aria-label={t("business.dashboard.basicStatus.includesAria")}>
        {BASIC_INCLUDED_KEYS.map((key) => (
          <li key={key} className="basic-plan-status-card__feature">
            <Check className="basic-plan-status-card__check" aria-hidden />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

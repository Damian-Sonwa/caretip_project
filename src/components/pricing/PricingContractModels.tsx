import { CalendarDays, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BillingCycle } from "@/app/data/pricingTypes";
import { cn } from "@/lib/utils";

type PricingContractModelsProps = {
  billingCycle: BillingCycle;
  className?: string;
};

export function PricingContractModels({ billingCycle, className }: PricingContractModelsProps) {
  const { t } = useTranslation();
  const modelKey = billingCycle === "yearly" ? "annual" : "monthly";

  return (
    <section
      className={cn("caretip-pricing-contract-models mx-auto max-w-3xl", className)}
      aria-labelledby="pricing-contract-models-heading"
    >
      <h3 id="pricing-contract-models-heading" className="text-center text-sm font-semibold text-foreground">
        {t("staticPages.pricing.contractModels.title")}
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <article
          className={cn(
            "rounded-xl border p-4 text-left",
            modelKey === "monthly" ? "border-primary/30 bg-primary/5" : "border-border/70 bg-card/50",
          )}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
            {t("staticPages.pricing.contractModels.monthly.title")}
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {(["billing", "commitment", "cancel", "access"] as const).map((key) => (
              <li key={key}>{t(`staticPages.pricing.contractModels.monthly.${key}`)}</li>
            ))}
          </ul>
        </article>
        <article
          className={cn(
            "rounded-xl border p-4 text-left",
            modelKey === "annual" ? "border-primary/30 bg-primary/5" : "border-border/70 bg-card/50",
          )}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <RefreshCw className="h-4 w-4 text-primary" aria-hidden />
            {t("staticPages.pricing.contractModels.annual.title")}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("staticPages.pricing.contractModels.annual.body")}
          </p>
        </article>
      </div>
    </section>
  );
}

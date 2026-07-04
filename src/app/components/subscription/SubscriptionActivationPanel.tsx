import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ActivationPlanButtons } from "./ActivateCareTipCta";
import { cn } from "@/lib/utils";

type SubscriptionActivationPanelProps = {
  className?: string;
  compact?: boolean;
};

/** Compact activation block for billing settings (not the dashboard hero). */
export function SubscriptionActivationPanel({
  className,
  compact = false,
}: SubscriptionActivationPanelProps) {
  const { t } = useTranslation();

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.05] via-card to-muted/35 p-6 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] sm:p-8",
        className,
      )}
      aria-labelledby="subscription-activation-panel-title"
    >
      <div className="relative flex flex-col gap-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t("subscription.activation.eyebrow")}
          </p>
          <h2
            id="subscription-activation-panel-title"
            className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            {compact ? t("subscription.activation.billingCompactTitle") : t("subscription.activation.title")}
          </h2>
          {!compact ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("subscription.activation.body")}
            </p>
          ) : null}
        </div>
        <ActivationPlanButtons />
        <p className="text-sm text-muted-foreground">
          {t("subscription.activation.billingNote")}{" "}
          <Link
            to="/dashboard/billing/subscription"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("subscription.activation.billingLink")}
          </Link>
        </p>
      </div>
    </section>
  );
}

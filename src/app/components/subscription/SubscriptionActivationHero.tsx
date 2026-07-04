import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { ActivationPlanButtons } from "./ActivateCareTipCta";
import { cn } from "@/lib/utils";

/** Single activation hero — used once at the top of the business dashboard. */
export function SubscriptionActivationHero({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <section
      className={cn(
        "relative mx-auto w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-primary/12 bg-gradient-to-br from-primary/[0.07] via-card to-muted/35 p-8 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.14)] sm:p-10 lg:p-12",
        className,
      )}
      aria-labelledby="dashboard-activation-hero-title"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/[0.06]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-primary/[0.04]" aria-hidden />
      <div className="relative mx-auto flex max-w-3xl flex-col gap-6 text-center lg:max-w-4xl">
        <div className="mx-auto flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.08] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {t("subscription.activation.eyebrow")}
        </div>
        <div className="space-y-3">
          <h1
            id="dashboard-activation-hero-title"
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2rem]"
          >
            {t("subscription.activation.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("subscription.activation.body")}
          </p>
        </div>
        <ActivationPlanButtons className="text-left" />
        <p className="text-xs text-muted-foreground sm:text-sm">
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

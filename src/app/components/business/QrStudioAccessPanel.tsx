import { Link } from "react-router";
import { Circle, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ActivateCareTipCta } from "../subscription/ActivateCareTipCta";
import { ActivationPlanButtons } from "../subscription/ActivateCareTipCta";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type QrStudioAccessBlockReason = "subscription" | "verification" | "both";

type QrStudioAccessPanelProps = {
  reason: QrStudioAccessBlockReason;
  className?: string;
};

export function QrStudioAccessPanel({ reason, className }: QrStudioAccessPanelProps) {
  const { t } = useTranslation();

  if (reason === "subscription") {
    return (
      <section
        className={cn(
          "relative mx-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-primary/12 bg-gradient-to-br from-primary/[0.06] via-card to-stone-50/80 p-8 text-center shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] sm:p-10",
          className,
        )}
        aria-labelledby="qr-studio-access-subscription-title"
      >
        <QrCode className="mx-auto h-12 w-12 text-primary/70" aria-hidden />
        <h2
          id="qr-studio-access-subscription-title"
          className="mt-5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          {t("business.qrStudio.access.subscriptionTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("business.qrStudio.access.subscriptionBody")}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ActivateCareTipCta action="trial" size="md" />
          <Link
            to="/dashboard/billing/subscription"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
          >
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            {t("business.qrStudio.access.viewPlans")}
          </Link>
        </div>
      </section>
    );
  }

  if (reason === "verification") {
    return (
      <section
        className={cn(
          "relative mx-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-border/70 bg-card p-8 text-center shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)] sm:p-10",
          className,
        )}
        aria-labelledby="qr-studio-access-verification-title"
      >
        <ShieldCheck className="mx-auto h-12 w-12 text-primary/75" aria-hidden />
        <h2
          id="qr-studio-access-verification-title"
          className="mt-5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          {t("business.qrStudio.access.verificationTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t("business.qrStudio.access.verificationBody")}
        </p>
        <div className="mt-6">
          <Button asChild className="min-h-11 px-6">
            <Link to="/verification-pending">{t("business.qrStudio.access.continueVerification")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  const steps = [
    { key: "subscription", label: t("business.qrStudio.access.checklist.subscription") },
    { key: "verification", label: t("business.qrStudio.access.checklist.verification") },
    { key: "generate", label: t("business.qrStudio.access.checklist.generate") },
  ] as const;

  return (
    <section
      className={cn(
        "relative mx-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-primary/12 bg-gradient-to-br from-primary/[0.05] via-card to-stone-50/80 p-8 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] sm:p-10",
        className,
      )}
      aria-labelledby="qr-studio-access-checklist-title"
    >
      <h2
        id="qr-studio-access-checklist-title"
        className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
      >
        {t("business.qrStudio.access.checklistTitle")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t("business.qrStudio.access.checklistBody")}
      </p>
      <ol className="mt-6 space-y-3 text-left">
        {steps.map((step, index) => (
          <li
            key={step.key}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/80 px-4 py-3"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <span className="text-sm font-medium text-foreground">{step.label}</span>
            <Circle className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
          </li>
        ))}
      </ol>
      <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
        <ActivationPlanButtons className="text-left" />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" className="min-h-11">
            <Link to="/verification-pending">{t("business.qrStudio.access.continueVerification")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function resolveQrStudioAccessBlock(
  entitlementsReady: boolean,
  hasOperationalSubscription: boolean,
  canUseProductionQr: boolean,
): QrStudioAccessBlockReason | null {
  if (!entitlementsReady) return null;
  const needsSubscription = !hasOperationalSubscription;
  const needsVerification = !canUseProductionQr;
  if (!needsSubscription && !needsVerification) return null;
  if (needsSubscription && needsVerification) return "both";
  if (needsSubscription) return "subscription";
  return "verification";
}

import { useState } from "react";
import { Link } from "react-router";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  activationCheckoutErrorMessage,
  startActivationCheckout,
  type ActivationCheckoutPlan,
} from "@/app/lib/activateCareTipCheckout";
import { cn } from "@/lib/utils";

type ActivateCareTipCtaProps = {
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
  /** billing = link to billing page; trial = start trial checkout */
  action?: "billing" | "trial";
};

export function ActivateCareTipCta({
  className,
  variant = "primary",
  size = "sm",
  action = "billing",
}: ActivateCareTipCtaProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const baseClass = cn(
    "inline-flex touch-manipulation items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-60",
    size === "sm" ? "min-h-9 px-4 text-xs" : "min-h-11 px-5 text-sm",
    variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
    variant === "outline" &&
      "border border-border bg-background text-foreground hover:bg-muted/50",
    variant === "ghost" && "text-primary hover:bg-primary/10",
    className,
  );

  if (action === "billing") {
    return (
      <Link to="/dashboard/billing/subscription" className={baseClass}>
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {t("subscription.activation.activateCta")}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={baseClass}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void startActivationCheckout("trial", t)
          .catch((err) => toast.error(activationCheckoutErrorMessage(err, t)))
          .finally(() => setBusy(false));
      }}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
      {t(action === "trial" ? "subscription.activation.trialCta" : "subscription.activation.activateCta")}
    </button>
  );
}

export function ActivationPlanButtons({
  className,
  layout = "grid",
}: {
  className?: string;
  layout?: "grid" | "row";
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<ActivationCheckoutPlan | null>(null);

  async function handle(plan: ActivationCheckoutPlan) {
    setBusy(plan);
    try {
      await startActivationCheckout(plan, t);
    } catch (err) {
      toast.error(activationCheckoutErrorMessage(err, t));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={cn(
        layout === "grid" ? "grid gap-3 sm:grid-cols-3" : "flex flex-wrap gap-3",
        className,
      )}
    >
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void handle("trial")}
        className="flex min-h-[44px] flex-col items-start gap-1 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-left transition-colors hover:bg-primary/10 disabled:opacity-60"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {busy === "trial" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          )}
          {t("subscription.activation.trialCta")}
        </span>
        <span className="text-xs text-muted-foreground">{t("subscription.activation.trialHint")}</span>
      </button>

      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void handle("starter")}
        className="flex min-h-[44px] flex-col items-start gap-1 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
      >
        <span className="text-sm font-semibold text-foreground">
          {busy === "starter" ? <Loader2 className="inline h-4 w-4 animate-spin" aria-hidden /> : null}
          {t("subscription.activation.starterCta")}
        </span>
        <span className="text-xs text-muted-foreground">{t("subscription.activation.starterHint")}</span>
      </button>

      <button
        type="button"
        disabled={busy !== null}
        onClick={() => void handle("business")}
        className="flex min-h-[44px] flex-col items-start gap-1 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-60"
      >
        <span className="text-sm font-semibold text-foreground">
          {busy === "business" ? <Loader2 className="inline h-4 w-4 animate-spin" aria-hidden /> : null}
          {t("subscription.activation.businessCta")}
        </span>
        <span className="text-xs text-muted-foreground">{t("subscription.activation.businessHint")}</span>
      </button>
    </div>
  );
}

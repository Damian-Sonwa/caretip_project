import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { useRequireAuth } from "../../hooks/useRequireAuth";

/** KYC is not yet exposed to business managers — informational only. */
export function BusinessKycComingSoonPage() {
  const { t } = useTranslation();
  useRequireAuth();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center space-y-4 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("business.kyc.comingSoon.badge")}
        </p>
        <h1 className="text-xl font-semibold text-foreground">{t("business.kyc.comingSoon.title")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("business.kyc.comingSoon.body")}</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("business.kyc.comingSoon.backDashboard")}
          </Link>
          <Link
            to="/awaiting-approval"
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t("business.kyc.comingSoon.onboardingStatus")}
          </Link>
        </div>
      </div>
    </div>
  );
}

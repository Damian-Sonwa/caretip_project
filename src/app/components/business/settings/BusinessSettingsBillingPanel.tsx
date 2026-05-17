import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Check, Euro, Heart, TrendingUp } from "lucide-react";
import { BusinessSettingsPanelShell } from "./BusinessSettingsPanelShell";

export function BusinessSettingsBillingPanel() {
  const { t } = useTranslation();

  return (
    <BusinessSettingsPanelShell
      title={t("business.settings.panels.billingTitle")}
      description={t("business.settings.panels.billingDesc")}
    >
      <div className="rounded-xl bg-gradient-to-br from-accent to-primary p-6 text-white shadow-lg sm:p-8">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
          <Check className="h-3 w-3" />
          {t("business.accountSettings.heroPill")}
        </span>
        <h3 className="mt-3 text-xl font-bold">{t("business.accountSettings.heroTitle")}</h3>
        <p className="mt-2 max-w-xl text-sm text-white/85">{t("business.accountSettings.heroBodyLong")}</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 shrink-0 opacity-90" />
            <div>
              <p className="text-xs text-white/70">{t("business.accountSettings.statModel")}</p>
              <p className="text-sm font-semibold">{t("business.accountSettings.statModelValue")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Euro className="h-5 w-5 shrink-0 opacity-90" />
            <div>
              <p className="text-xs text-white/70">{t("business.accountSettings.statFees")}</p>
              <p className="text-sm font-semibold">{t("business.accountSettings.statFeesValue")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 shrink-0 opacity-90" />
            <div>
              <p className="text-xs text-white/70">{t("business.accountSettings.statMember")}</p>
              <p className="text-sm font-semibold">{t("business.accountSettings.statMemberValue")}</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/dashboard/transactions"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary shadow-md"
          >
            {t("business.accountSettings.linkTipsActivity")}
          </Link>
          <Link
            to="/pricing"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-white/35 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm"
          >
            {t("business.accountSettings.linkFeeDetails")}
          </Link>
        </div>
      </div>
    </BusinessSettingsPanelShell>
  );
}

import { Link } from "react-router";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PlatformPage, PlatformPageHeader } from "../../components/platform/PlatformPageChrome";
import { platformUi } from "../../components/platform/platformDashboardUi";
import { PLATFORM_BUSINESS_BASE } from "../../components/platform/platformAdminNav";

/** Platform admin — KYC management reserved for a future release. */
export function PlatformKycComingSoonPage() {
  const { t } = useTranslation();

  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={ShieldCheck}
        title={t("admin.kycComingSoon.title")}
        subtitle={t("admin.kycComingSoon.subtitle")}
      />
      <div className={platformUi.contentCard}>
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-10 text-center">
          <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("admin.kycComingSoon.badge")}
          </span>
          <ShieldCheck className="h-12 w-12 text-muted-foreground/60" aria-hidden />
          <p className="text-sm leading-relaxed text-muted-foreground">{t("admin.kycComingSoon.body")}</p>
          <Link
            to={`${PLATFORM_BUSINESS_BASE}/onboarding-verification`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("admin.kycComingSoon.onboardingLink")}
          </Link>
        </div>
      </div>
    </PlatformPage>
  );
}

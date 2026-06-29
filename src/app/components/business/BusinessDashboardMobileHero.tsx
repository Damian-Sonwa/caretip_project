import { motion } from "motion/react";
import { Link } from "react-router";
import { Sparkles, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CareIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { businessUi } from "./businessDashboardUi";
import {
  BusinessHeroPulseMetrics,
  type BusinessHeroOperationalPulse,
} from "./BusinessHeroPulseMetrics";

type BusinessDashboardMobileHeroProps = {
  welcomeName?: string;
  isPreviewMode: boolean;
  heroPulseLoading: boolean;
  operationalPulse: BusinessHeroOperationalPulse | null;
  isPeriodRefreshing: boolean;
  className?: string;
};

export function BusinessDashboardMobileHero({
  welcomeName,
  isPreviewMode,
  heroPulseLoading,
  operationalPulse,
  isPeriodRefreshing,
  className,
}: BusinessDashboardMobileHeroProps) {
  const { t } = useTranslation();

  return (
    <section
      className={cn("business-dashboard-mobile-hero", className)}
      aria-labelledby="business-mobile-hero-title"
    >
      <div className="business-dashboard-mobile-hero__content">
        <div className="business-dashboard-mobile-hero__badge">
          <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
          <span>
            {welcomeName
              ? t("business.hero.welcomeBackNamed", { name: welcomeName })
              : t("business.hero.welcomeBack")}
          </span>
        </div>

        <h1 id="business-mobile-hero-title" className="business-dashboard-mobile-hero__title">
          {t("business.hero.headlineLine1")}
          <span className="block">{t("business.hero.headlineLine2")}</span>
        </h1>

        <p className="business-dashboard-mobile-hero__description">{t("business.hero.sub")}</p>

        <motion.div
          className="business-dashboard-mobile-hero__actions"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {isPreviewMode ? (
            <>
              <Button
                type="button"
                className={cn(businessUi.btnPrimary, "business-dashboard-mobile-hero__btn")}
                asChild
              >
                <Link to="/dashboard/billing/subscription" className={businessUi.heroCtaLink}>
                  <Sparkles className="business-dashboard-mobile-hero__btn-icon" aria-hidden />
                  {t("business.dashboard.preview.viewPlans")}
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(businessUi.btnSecondary, "business-dashboard-mobile-hero__btn business-dashboard-mobile-hero__btn--secondary")}
                asChild
              >
                <Link to="#dashboard-premium-features" className={businessUi.heroCtaLink}>
                  {t("business.dashboard.preview.exploreFeatures")}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                className={cn(businessUi.btnPrimary, "business-dashboard-mobile-hero__btn")}
                asChild
              >
                <Link to="/dashboard/qr-studio/employees" className={businessUi.heroCtaLink}>
                  <CareIcon name="tableQr" size="sm" className="business-dashboard-mobile-hero__btn-icon" />
                  {t("business.hero.manageQr")}
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(businessUi.btnSecondary, "business-dashboard-mobile-hero__btn business-dashboard-mobile-hero__btn--secondary")}
                asChild
              >
                <Link to="/dashboard/team/employees" className={businessUi.heroCtaLink}>
                  <Users className="business-dashboard-mobile-hero__btn-icon" aria-hidden />
                  {t("business.hero.manageTeam")}
                </Link>
              </Button>
            </>
          )}
        </motion.div>

        <BusinessHeroPulseMetrics
          loading={heroPulseLoading}
          pulse={operationalPulse}
          isRefreshing={isPeriodRefreshing}
        />
      </div>
    </section>
  );
}

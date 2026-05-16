import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

export function LandingFinalCtaSection() {
  const { t } = useTranslation();
  return (
    <section
      className={cn(
        landingUi.section,
        "relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#fcfbf9_50%,#fffefb_100%)] md:py-24 lg:py-28 dark:bg-neutral-950",
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_130%_75%_at_50%_0%,rgba(235,153,44,0.09),transparent_58%),radial-gradient(ellipse_120%_60%_at_20%_80%,rgba(0,0,0,0.028),transparent_55%),radial-gradient(ellipse_120%_60%_at_85%_70%,rgba(0,0,0,0.022),transparent_55%)]"
      />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={cn(
          landingUi.sectionIntro,
          "relative mx-auto mb-0 max-w-3xl max-lg:max-w-none max-lg:px-1 sm:max-w-2xl lg:max-w-3xl",
        )}
      >
        <h2 className={landingUi.sectionTitle}>{t("landing.finalCta.title")}</h2>
        <p className={landingUi.sectionSubtitle}>{t("landing.finalCta.subtitle")}</p>
        <div className="flex w-full max-w-md justify-center pt-2 sm:pt-3">
          <Link
            to="/auth?mode=signup&role=business&from=landing"
            className={cn(
              landingUi.cta,
              "shadow-[0_12px_38px_-10px_rgba(235,153,44,0.42)] hover:shadow-[0_14px_44px_-8px_rgba(235,153,44,0.48)] active:scale-[0.99]",
            )}
          >
            {t("landing.finalCta.cta")}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

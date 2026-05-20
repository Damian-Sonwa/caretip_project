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
        "caretip-landing-final-cta relative overflow-hidden dark:bg-neutral-950",
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
      />
      <motion.div
        data-polish-view
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn(landingUi.sectionIntro, landingUi.sectionShell, "relative mb-0")}
      >
        <h2 className={landingUi.sectionTitle}>{t("landing.finalCta.title")}</h2>
        <p className={landingUi.sectionSubtitle}>{t("landing.finalCta.subtitle")}</p>
        <div className="flex w-full justify-center max-lg:px-0">
          <Link
            to="/auth?mode=signup&role=business&from=landing"
            className={cn(landingUi.heroCtaPrimary, "gap-2")}
          >
            {t("landing.finalCta.cta")}
            <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingBenefitBlock } from "@/components/landing/LandingCheckBadge";
import businessSectionImg from "../../../../images/business_section.jpeg";

export function BusinessLandingSection() {
  const { t } = useTranslation();
  return (
    <section
      id="business-section"
      className="scroll-mt-[80px] bg-white px-2 py-16 max-md:overflow-x-hidden sm:px-6 sm:py-20 md:py-24 lg:py-28 dark:bg-neutral-950"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12">
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="order-2 flex w-full flex-col items-center space-y-6 text-center max-md:px-2 max-md:pt-2 md:order-1 md:px-0 md:pt-0 lg:items-start lg:text-left"
        >
          <div className="flex w-full max-w-xl flex-col items-center space-y-4 lg:items-start">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              {t("landing.businessSection.pill")}
            </span>
            <h2 className="text-4xl font-bold text-neutral-900 sm:text-5xl dark:text-neutral-100">
              {t("landing.businessSection.titleLine1")}
              <br />
              <span className="text-primary">{t("landing.businessSection.titleLine2")}</span>
            </h2>
            <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("landing.businessSection.subtitle")}
            </p>
          </div>

          <div className="w-full max-w-xl space-y-4 text-left">
            <LandingBenefitBlock
              title={t("landing.businessSection.b1Title")}
              description={t("landing.businessSection.b1Text")}
            />
            <LandingBenefitBlock
              title={t("landing.businessSection.b2Title")}
              description={t("landing.businessSection.b2Text")}
            />
            <LandingBenefitBlock
              title={t("landing.businessSection.b3Title")}
              description={t("landing.businessSection.b3Text")}
            />
            <LandingBenefitBlock
              title={t("landing.businessSection.b4Title")}
              description={t("landing.businessSection.b4Text")}
            />
          </div>

          <Link
            to="/auth?mode=signup&role=business&from=landing"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-semibold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-primary/90"
          >
            {t("landing.businessSection.cta")}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </motion.div>

        <motion.div
          initial={{ x: 30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative order-1 flex w-full max-w-[95%] flex-col items-center justify-center max-md:-mx-2 max-md:w-[calc(100%+1rem)] md:order-2 md:mx-auto md:w-full"
        >
          <div className="flex w-full min-h-0 items-center justify-center">
            <div className="mx-auto mt-4 w-full max-w-none overflow-hidden rounded-[2.5rem] border border-gray-200/30 shadow-xl max-md:min-h-[min(42dvh,380px)] md:mt-0 md:max-w-md lg:max-w-2xl">
              <img
                src={businessSectionImg}
                alt={t("landing.businessSection.imageAlt")}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

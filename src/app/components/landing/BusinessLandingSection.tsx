import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingBenefitBlock } from "@/components/landing/LandingCheckBadge";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";
import businessSectionImg from "../../../../images/business_section.jpeg";

export function BusinessLandingSection() {
  const { t } = useTranslation();
  return (
    <section
      id="business-section"
      className={cn(landingUi.section, landingUi.sectionWhite, "max-md:overflow-x-hidden")}
    >
      <div className={landingUi.splitGrid}>
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={cn(landingUi.copyColumn, "md:order-1")}
        >
          <div className={landingUi.copyStack}>
            <span className={landingUi.pill}>{t("landing.businessSection.pill")}</span>
            <h2 className={landingUi.headline}>
              {t("landing.businessSection.titleLine1")}
              <br />
              <span className="text-primary">{t("landing.businessSection.titleLine2")}</span>
            </h2>
            <p className={landingUi.subtitle}>{t("landing.businessSection.subtitle")}</p>
          </div>

          <div className={landingUi.benefitList}>
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
            className={landingUi.cta}
          >
            {t("landing.businessSection.cta")}
            <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
          </Link>
        </motion.div>

        <motion.div
          initial={{ x: 30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={cn(landingUi.visualColumn, "md:order-2")}
        >
          <div className={cn(landingUi.visualFrame, "max-lg:max-h-[min(40vh,320px)]")}>
            <img
              src={businessSectionImg}
              alt={t("landing.businessSection.imageAlt")}
              className="h-full min-h-[200px] w-full object-cover object-center sm:min-h-[240px]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

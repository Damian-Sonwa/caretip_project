import { motion } from "motion/react";
import { Link } from "react-router";
import { LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingBenefitBlock } from "@/components/landing/LandingCheckBadge";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";
import newEmployeeImg from "../../../../images/cafe-employee.png";

export function EmployeeLandingSection() {
  const { t } = useTranslation();
  return (
    <section
      id="for-employees"
      className={cn(landingUi.section, landingUi.sectionMuted)}
    >
      <div className={landingUi.splitGrid}>
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={cn(landingUi.copyColumn, "lg:order-2")}
        >
          <div className={landingUi.copyStack}>
            <span className={landingUi.pill}>{t("landing.employeeSection.pill")}</span>
            <h2 className={landingUi.headline}>
              {t("landing.employeeSection.titleLine1")}
              <br />
              <span className="text-primary">{t("landing.employeeSection.titleLine2")}</span>
            </h2>
            <p className={landingUi.subtitle}>{t("landing.employeeSection.subtitle")}</p>
          </div>

          <div className={landingUi.benefitList}>
            <LandingBenefitBlock
              title={t("landing.employeeSection.b1Title")}
              description={t("landing.employeeSection.b1Text")}
            />
            <LandingBenefitBlock
              title={t("landing.employeeSection.b2Title")}
              description={t("landing.employeeSection.b2Text")}
            />
            <LandingBenefitBlock
              title={t("landing.employeeSection.b3Title")}
              description={t("landing.employeeSection.b3Text")}
            />
          </div>

          <Link to="/join" className={landingUi.cta}>
            <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden />
            {t("landing.employeeSection.cta")}
          </Link>
        </motion.div>

        <motion.div
          initial={{ x: -30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={cn(landingUi.visualColumn, "lg:order-1")}
        >
          <div className={cn(landingUi.visualFrame, "flex items-center justify-center p-2 sm:p-3")}>
            <img
              src={newEmployeeImg}
              alt={t("landing.employeeSection.imageAlt")}
              className={landingUi.visualImgContain}
              loading="lazy"
              decoding="async"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

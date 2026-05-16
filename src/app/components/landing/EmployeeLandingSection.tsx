import { motion } from "motion/react";
import { Link } from "react-router";
import { LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LandingBenefitBlock } from "@/components/landing/LandingCheckBadge";
import newEmployeeImg from "../../../../images/cafe-employee.png";

export function EmployeeLandingSection() {
  const { t } = useTranslation();
  return (
    <section
      id="for-employees"
      className="scroll-mt-[80px] w-full min-w-0 bg-gray-50 px-3 py-12 sm:px-6 sm:py-20 md:py-24 lg:py-28 dark:bg-neutral-900"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center justify-items-center gap-6 sm:gap-10 lg:grid-cols-2 lg:justify-items-stretch lg:gap-12">
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative order-1 flex w-full max-w-lg flex-col items-center justify-center max-md:justify-self-center sm:max-w-xl lg:order-1 lg:max-w-none lg:w-full lg:justify-self-stretch"
        >
          <div className="flex w-full min-h-0 items-center justify-center max-md:px-1">
            <div className="mx-auto mt-4 flex w-full items-center justify-center overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white shadow-xl max-md:min-h-[min(28dvh,260px)] sm:mt-10 lg:min-h-0 dark:border-neutral-800 dark:bg-neutral-900">
              <img
                src={newEmployeeImg}
                alt={t("landing.employeeSection.imageAlt")}
                className="mx-auto block h-auto max-h-[min(52vh,420px)] w-full max-w-full object-contain object-center sm:max-h-none"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ x: 30, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="order-2 flex w-full max-w-lg flex-col items-center space-y-6 text-center max-md:justify-self-center max-md:px-2 max-md:pt-2 sm:max-w-xl md:px-0 md:pt-0 lg:order-2 lg:max-w-none lg:items-start lg:justify-self-stretch lg:text-left"
        >
          <div className="flex w-full max-w-xl flex-col items-center space-y-3 lg:items-start">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              {t("landing.employeeSection.pill")}
            </span>
            <h2 className="text-4xl font-bold text-neutral-900 sm:text-5xl dark:text-neutral-100">
              {t("landing.employeeSection.titleLine1")}
              <br />
              <span className="text-primary">{t("landing.employeeSection.titleLine2")}</span>
            </h2>
            <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              {t("landing.employeeSection.subtitle")}
            </p>
          </div>

          <div className="w-full max-w-xl space-y-4 text-left">
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

          <Link
            to="/join"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 font-semibold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-primary/90"
          >
            <LayoutDashboard className="h-5 w-5" aria-hidden />
            {t("landing.employeeSection.cta")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

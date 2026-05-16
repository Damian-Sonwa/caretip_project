import { useMemo } from "react";
import { motion } from "motion/react";
import { CreditCard, Smartphone, Clock, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

const cardClassName = cn(
  "group relative flex h-full flex-col rounded-2xl border border-neutral-200/95 bg-white",
  "px-3.5 pb-4 pt-3.5 max-md:px-3.5 max-md:pb-4 max-md:pt-3.5 sm:px-6 sm:pb-8 sm:pt-7",
  "shadow-[0_1px_2px_rgba(15,15,15,0.04),0_10px_28px_rgba(15,15,15,0.06)]",
  "transition-[box-shadow,border-color,transform] duration-300 ease-out",
  "hover:border-neutral-300/90 hover:shadow-[0_2px_4px_rgba(15,15,15,0.05),0_16px_40px_rgba(15,15,15,0.08)]",
  "dark:border-neutral-700/90 dark:bg-neutral-900",
  "dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_rgba(0,0,0,0.45)]",
  "dark:hover:border-neutral-600 dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.4),0_18px_44px_rgba(0,0,0,0.5)]",
);

const iconWrapClassName = cn(
  "mb-2.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg max-md:mb-2.5 max-md:h-9 max-md:w-9 sm:mb-5 sm:h-[52px] sm:w-[52px] sm:rounded-xl",
  "bg-primary/[0.14] text-primary ring-1 ring-primary/25",
  "dark:bg-primary/20 dark:text-[#f0a84d] dark:ring-primary/35",
);

const iconClassName =
  "h-4 w-4 stroke-[2.25] text-primary max-md:h-4 max-md:w-4 dark:text-[#f0a84d] sm:h-[22px] sm:w-[22px]";

export function PaymentsSection() {
  const { t } = useTranslation();

  const bullets = useMemo(
    () =>
      [
        { icon: CreditCard, title: t("landing.paymentsTrust.b1Title"), text: t("landing.paymentsTrust.b1Text") },
        { icon: Clock, title: t("landing.paymentsTrust.b2Title"), text: t("landing.paymentsTrust.b2Text") },
        { icon: Smartphone, title: t("landing.paymentsTrust.b3Title"), text: t("landing.paymentsTrust.b3Text") },
        { icon: ShieldCheck, title: t("landing.paymentsTrust.b4Title"), text: t("landing.paymentsTrust.b4Text") },
      ],
    [t],
  );

  return (
    <section
      id="payments-trust"
      className={cn(
        landingUi.section,
        "relative overflow-hidden border-y border-neutral-200/70 dark:border-neutral-800/80",
        "bg-[linear-gradient(180deg,#f8f6f3_0%,#f3f1ed_42%,#f8f6f3_100%)]",
        "dark:bg-[linear-gradient(180deg,#0c0c0c_0%,#111010_45%,#0c0c0c_100%)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_0%,rgba(235,153,44,0.06),transparent_62%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_0%,rgba(235,153,44,0.08),transparent_62%)]"
      />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={landingUi.sectionIntro}
        >
          <span className={landingUi.pill}>{t("landing.paymentsTrust.pill")}</span>
          <h2
            className={cn(landingUi.sectionTitle, "mt-2 max-md:mt-2 sm:mt-3.5")}
          >
            {t("landing.paymentsTrust.title")}
          </h2>
          <p
            className={cn(landingUi.sectionSubtitle, "text-neutral-600 dark:text-neutral-400")}
          >
            {t("landing.paymentsTrust.subtitle")}
          </p>
        </motion.div>

        <ul className="grid gap-2.5 max-md:gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {bullets.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.06 }}
                className={cardClassName}
              >
                <div className={iconWrapClassName}>
                  <Icon className={iconClassName} aria-hidden />
                </div>
                <h3 className="text-[14px] font-semibold leading-snug tracking-tight text-neutral-900 max-md:text-[14px] dark:text-neutral-50 sm:text-base">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-[1.52] text-neutral-600 max-md:mt-1.5 dark:text-neutral-400 sm:mt-3 sm:text-sm sm:leading-[1.65]">
                  {item.text}
                </p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

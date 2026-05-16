import { useMemo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import tableQrImg from "../../../../images/table_QR.png";
import atReceptionImg from "../../../../images/At_reception.png";
import salonImg from "../../../../images/salon.jpeg";
import homeImg from "../../../../images/home.jpeg";
import { landingUi } from "@/components/landing/landingUi";
import { landingType } from "@/components/landing/landingTypography";
import { cn } from "@/lib/utils";

export function LandingRealLifeSection() {
  const { t } = useTranslation();

  const scenarios = useMemo(
    () =>
      [
        {
          headline: t("landing.realLife.s1Headline"),
          text: t("landing.realLife.s1Text"),
          img: tableQrImg,
          alt: t("landing.realLife.s1Alt"),
        },
        {
          headline: t("landing.realLife.s2Headline"),
          text: t("landing.realLife.s2Text"),
          img: atReceptionImg,
          alt: t("landing.realLife.s2Alt"),
        },
        {
          headline: t("landing.realLife.s3Headline"),
          text: t("landing.realLife.s3Text"),
          img: salonImg,
          alt: t("landing.realLife.s3Alt"),
        },
        {
          headline: t("landing.realLife.s4Headline"),
          text: t("landing.realLife.s4Text"),
          img: homeImg,
          alt: t("landing.realLife.s4Alt"),
        },
      ],
    [t],
  );

  return (
    <section
      id="real-life"
      className={cn(landingUi.section, landingUi.sectionWhite)}
    >
      <div className="mx-auto max-w-7xl">
        <div className={landingUi.sectionIntro}>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={landingUi.sectionTitle}
          >
            {t("landing.realLife.title")}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 sm:justify-items-stretch sm:gap-6 lg:gap-7">
          {scenarios.map((item, idx) => (
            <motion.article
              key={item.headline}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
              className="group flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:max-w-none dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <img
                  src={item.img}
                  alt={item.alt}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
              </div>
              <div className={cn(landingUi.cardCopyStack, "p-5 sm:p-6")}>
                <h3 className={cn(landingType.cardTitle, "tracking-tight")}>{item.headline}</h3>
                <p className={landingUi.cardFeatureBody}>{item.text}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

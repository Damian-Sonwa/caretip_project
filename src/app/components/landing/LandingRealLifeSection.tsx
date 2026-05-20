import { useMemo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import tableQrImg from "../../../../images/table_QR.png";
import atReceptionImg from "../../../../images/At_reception.png";
import salonImg from "../../../../images/salon.jpeg";
import homeImg from "../../../../images/home.jpeg";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
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
            className={cn(landingUi.sectionTitle, landingUi.mobileSectionHeadline)}
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
              className={cn(
                "caretip-landing-card group flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:max-w-none dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none",
                landingUi.mobileStackCard,
              )}
            >
              <div
                className={cn(
                  landingUi.cardCopyStack,
                  landingUi.mobileStackIntro,
                  "order-1 px-5 pb-0 pt-5 sm:px-6 sm:pt-6 lg:order-2 lg:pb-0 lg:pt-0",
                )}
              >
                <h3
                  className={cn(
                    landingType.cardTitle,
                    landingUi.mobileSectionHeadline,
                    "tracking-tight max-lg:text-center lg:text-left",
                  )}
                >
                  {item.headline}
                </h3>
              </div>
              <div
                className={cn(
                  "relative aspect-[16/10] w-full overflow-hidden",
                  landingUi.mobileStackVisual,
                  "order-2 lg:order-1",
                )}
              >
                <img
                  src={item.img}
                  alt={item.alt}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
              </div>
              {landingCopyVisible(item.text) ? (
                <div
                  className={cn(
                    landingUi.cardCopyStack,
                    landingUi.mobileStackAfter,
                    "order-3 px-5 pb-5 pt-0 sm:px-6 sm:pb-6 lg:px-6 lg:pb-6 lg:pt-0",
                  )}
                >
                  <p className={cn(landingUi.cardFeatureBody, "max-lg:text-center lg:mt-2")}>{item.text}</p>
                </div>
              ) : null}
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

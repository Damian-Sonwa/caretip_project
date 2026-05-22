import { useMemo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import tableQrImg from "../../../../images/table_QR.png";
import atReceptionImg from "../../../../images/At_reception.png";
import salonImg from "../../../../images/salon.jpeg";
import homeImg from "../../../../images/home.jpeg";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { ExpandableInfoCard } from "@/components/ui/expandable-info-card";
import { cn } from "@/lib/utils";

export function LandingRealLifeSection() {
  const { t } = useTranslation();

  const scenarios = useMemo(
    () =>
      [
        {
          headline: t("landing.realLife.s1Headline"),
          tag: t("landing.realLife.s1Tag"),
          text: t("landing.realLife.s1Text"),
          detail: t("landing.realLife.s1Detail"),
          img: tableQrImg,
          alt: t("landing.realLife.s1Alt"),
        },
        {
          headline: t("landing.realLife.s2Headline"),
          tag: t("landing.realLife.s2Tag"),
          text: t("landing.realLife.s2Text"),
          detail: t("landing.realLife.s2Detail"),
          img: atReceptionImg,
          alt: t("landing.realLife.s2Alt"),
        },
        {
          headline: t("landing.realLife.s3Headline"),
          tag: t("landing.realLife.s3Tag"),
          text: t("landing.realLife.s3Text"),
          detail: t("landing.realLife.s3Detail"),
          img: salonImg,
          alt: t("landing.realLife.s3Alt"),
        },
        {
          headline: t("landing.realLife.s4Headline"),
          tag: t("landing.realLife.s4Tag"),
          text: t("landing.realLife.s4Text"),
          detail: t("landing.realLife.s4Detail"),
          img: homeImg,
          alt: t("landing.realLife.s4Alt"),
        },
      ],
    [t],
  );

  const learnMore = t("landing.realLife.learnMore");
  const learnLess = t("landing.realLife.learnLess");

  return (
    <section id="real-life" className={cn(landingUi.section, landingUi.sectionWhite, "caretip-landing-rhythm-stone")}>
      <div className="mx-auto max-w-7xl">
        <div className={cn(landingUi.sectionIntro, "caretip-real-life-section-intro")}>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
              landingUi.sectionTitle,
              "max-lg:caretip-mobile-section-headline caretip-real-life-section-title",
            )}
          >
            {t("landing.realLife.title")}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 sm:justify-items-stretch sm:gap-6 lg:gap-7">
          {scenarios.map((item, idx) => (
            <motion.div
              key={item.headline}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
              className="w-full max-w-md sm:max-w-none"
            >
              <ExpandableInfoCard
                imageSrc={item.img}
                imageAlt={item.alt}
                title={item.headline}
                tag={landingCopyVisible(item.tag) ? item.tag : undefined}
                summary={item.text}
                detail={item.detail}
                learnMoreLabel={learnMore}
                learnLessLabel={learnLess}
                className={cn(
                  landingUi.mobileStackCard,
                  landingUi.realLifeCard,
                  "caretip-real-life-card",
                )}
                imageClassName={cn(landingUi.realLifeCardImage, "caretip-real-life-card-image")}
                titleClassName={cn(
                  landingUi.realLifeCardTitle,
                  "max-lg:text-center lg:text-left",
                )}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

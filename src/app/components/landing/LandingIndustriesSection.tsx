import { useMemo } from "react";
import { motion } from "motion/react";
import { Building2, HeartPulse, Scissors, Truck, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { landingFadeReveal } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

type IndustryId = "restaurant" | "hotel" | "healthcare" | "delivery" | "salon";

const INDUSTRY_ICONS: Record<IndustryId, LucideIcon> = {
  restaurant: UtensilsCrossed,
  hotel: Building2,
  healthcare: HeartPulse,
  delivery: Truck,
  salon: Scissors,
};

const INDUSTRY_IDS: IndustryId[] = ["restaurant", "hotel", "healthcare", "delivery", "salon"];

export function LandingIndustriesSection() {
  const { t } = useTranslation();

  const cards = useMemo(
    () =>
      INDUSTRY_IDS.map((id) => ({
        id,
        Icon: INDUSTRY_ICONS[id],
        title: t(`landing.industryCards.${id}.title`),
        benefit: t(`landing.industryCards.${id}.benefit`),
      })).filter((c) => landingCopyVisible(c.title) && landingCopyVisible(c.benefit)),
    [t],
  );

  if (cards.length === 0) return null;

  return (
    <section
      id="industries"
      className={cn(
        landingUi.section,
        landingUi.landingSurface,
        "caretip-landing-industries relative scroll-mt-[80px] overflow-hidden",
      )}
    >
      <motion.header
        className={cn(landingUi.sectionIntro, "relative mx-auto max-w-2xl")}
        {...landingFadeReveal}
      >
        <h2 className={landingUi.sectionTitle}>{t("landing.industryCards.sectionTitle")}</h2>
        {landingCopyVisible(t("landing.industryCards.sectionSubtitle")) ? (
          <p className={landingUi.sectionSubtitle}>{t("landing.industryCards.sectionSubtitle")}</p>
        ) : null}
      </motion.header>

      <div className="caretip-industry-cards-grid mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {cards.map((card, idx) => {
          const Icon = card.Icon;
          return (
            <motion.article
              key={card.id}
              className="caretip-industry-card"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-6% 0px" }}
              transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="caretip-industry-card__icon" aria-hidden>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="caretip-industry-card__title">{card.title}</h3>
              <p className="caretip-industry-card__benefit">{card.benefit}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

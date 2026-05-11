import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Navigation } from "../components/Navigation";
import { PricingSection } from "../components/PricingSection";
import { Footer } from "../components/Footer";
import { AuthLikePageBackground } from "../components/AuthLikePageBackground";
import { PRICING_TIERS } from "../data/pricingTiers";

export function PricingPage() {
  const { t } = useTranslation();
  const tiers = useMemo(
    () =>
      PRICING_TIERS.map((tier) => {
        const k = tier.tierKey;
        if (!k) return tier;
        return {
          ...tier,
          name: t(`staticPages.pricing.tiers.${k}.name`),
          feeNote: t(`staticPages.pricing.tiers.${k}.feeNote`),
          description: t(`staticPages.pricing.tiers.${k}.description`),
          features: [0, 1, 2, 3, 4].map((i) => t(`staticPages.pricing.tiers.${k}.f${i}`)),
          buttonText: t(`staticPages.pricing.tiers.${k}.button`),
        };
      }),
    [t],
  );
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white">
      <AuthLikePageBackground />
      <div className="relative z-10">
        <Navigation />
        <main id="fees" className="scroll-mt-20">
          <section className="px-6 pb-16 pt-24 sm:pb-24 sm:pt-28">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
                  {t("staticPages.pricing.pageTitle")}
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t("staticPages.pricing.pageSubtitle")}
                </p>
              </div>
              <PricingSection tiers={tiers} />
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}

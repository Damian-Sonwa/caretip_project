import React, { useMemo } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PricingSection } from "../components/PricingSection";
import { PRICING_TIERS } from "../data/pricingTiers";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

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
    <PublicPageShell maxWidth="pricing">
      <main id="pricing" className="scroll-mt-20">
        <PublicPageHeader
          centered
          showTrustChips
          title={t("staticPages.pricing.pageTitle")}
          subtitle={t("staticPages.pricing.pageSubtitle")}
        />

        <div
          className={cn(
            publicPageUi.sectionGap,
            publicPageUi.mutedBand,
            "relative overflow-hidden px-2 sm:px-3",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(233,120,28,0.06),transparent_65%)]"
            aria-hidden
          />
          <div className="relative">
            <PricingSection tiers={tiers} />
          </div>
        </div>

        <section className={cn(publicPageUi.sectionGap, publicPageUi.ctaPanel)}>
          <h3 className="mb-2 font-hero-display text-2xl font-bold tracking-[-0.02em] text-neutral-950 dark:text-neutral-50">
            {t("staticPages.pricing.ctaTitle")}
          </h3>
          <p className="mx-auto mb-6 max-w-xl text-neutral-700 dark:text-neutral-300">
            {t("staticPages.pricing.ctaBody")}
          </p>
          <Link to="/contact" className={publicPageUi.ctaPrimary}>
            {t("nav.requestDemo")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </main>
    </PublicPageShell>
  );
}

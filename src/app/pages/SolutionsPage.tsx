import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { SolutionSegment } from "@/components/public/solutions/SolutionSegment";
import { SOLUTIONS } from "@/components/public/solutions/solutionsConfig";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

export function SolutionsPage() {
  const { t } = useTranslation();

  return (
    <PublicPageShell maxWidth="wide">
      <PublicPageHeader
        title={t("staticPages.solutions.title")}
        subtitle={t("staticPages.solutions.subtitle")}
        showTrustChips
      />

      <div className={cn(publicPageUi.sectionGap, "space-y-12 sm:space-y-14 lg:space-y-16")}>
        {SOLUTIONS.map((def) => (
          <SolutionSegment
            key={def.id}
            Icon={def.Icon}
            reverse={def.reverse}
            title={t(`staticPages.solutions.${def.id}.title`)}
            body={t(`staticPages.solutions.${def.id}.body`)}
            bullets={[0, 1, 2].map((i) => t(`staticPages.solutions.${def.id}.b${i}`))}
            cta={t("staticPages.solutions.segmentCta")}
          />
        ))}
      </div>

      <section className={cn(publicPageUi.sectionGap, publicPageUi.mutedBand, "px-4 sm:px-6")}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className={cn(publicPageUi.sectionTitle, "mb-3")}>{t("staticPages.solutions.platformTitle")}</h2>
          <p className="text-neutral-700 dark:text-neutral-300">{t("staticPages.solutions.platformBody")}</p>
        </div>
      </section>

      <section className={cn(publicPageUi.sectionGap, publicPageUi.ctaPanel)}>
        <h3 className="mb-2 font-hero-display text-2xl font-bold tracking-[-0.02em] text-neutral-950 dark:text-neutral-50">
          {t("staticPages.solutions.ctaTitle")}
        </h3>
        <p className="mx-auto mb-6 max-w-xl text-neutral-700 dark:text-neutral-300">{t("staticPages.solutions.ctaBody")}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/contact" className={publicPageUi.ctaPrimary}>
            {t("nav.requestDemo")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200/90 bg-white/80 px-7 py-3 text-[0.9375rem] font-semibold text-neutral-900 transition-colors hover:border-primary/30 hover:bg-primary/[0.04] dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-100"
          >
            {t("staticPages.solutions.ctaPricing")}
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}

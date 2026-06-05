import { Link } from "react-router";
import { Shield, Zap } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { HowItWorksStepContent } from "@/components/public/HowItWorksStepContent";
import { HOW_IT_WORKS_STEPS } from "@/components/public/howItWorksFlow";
import { HowItWorksTimelineStep } from "@/components/public/HowItWorksTimelineStep";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

type JourneyPillar = { icon: string; label: string };

function parseJourneyPillars(raw: unknown): JourneyPillar[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { icon, label } = item as { icon?: unknown; label?: unknown };
    if (typeof icon !== "string" || typeof label !== "string") return [];
    return [{ icon, label }];
  });
}

export function HowItWorksPage() {
  const { t } = useTranslation();
  const journeyPillars = useMemo(() => {
    const raw = t("staticPages.howItWorks.journeyPillars", { returnObjects: true });
    return parseJourneyPillars(raw);
  }, [t]);

  return (
    <PublicPageShell maxWidth="wide">
      <PublicPageHeader
        centered
        introLayout="stack"
        title={t("staticPages.howItWorks.title")}
        subtitle={t("staticPages.howItWorks.subtitle")}
        afterSubtitle={
          journeyPillars.length > 0 ? (
            <ul className="flex w-full list-none flex-col items-start gap-2 sm:gap-2.5">
              {journeyPillars.map((pillar) => (
                <li key={pillar.label} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center text-base leading-none sm:h-8 sm:w-8 sm:text-lg"
                  >
                    {pillar.icon}
                  </span>
                  <span className="text-base font-medium leading-snug text-neutral-800 sm:text-lg dark:text-neutral-200">
                    {pillar.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : null
        }
        showTrustChips={false}
      />

      <div className={cn(publicPageUi.sectionGap, "relative space-y-12 sm:space-y-14 lg:space-y-16")}>
        {HOW_IT_WORKS_STEPS.map((def, index) => (
          <HowItWorksTimelineStep
            key={def.step}
            step={def.step}
            badge={t("staticPages.howItWorks.stepBadge", { n: def.step })}
            title={t(`staticPages.howItWorks.s${def.step}Title`)}
            icon={def.icon}
            visual={def.visual}
            reverse={def.reverse}
            isLast={index === HOW_IT_WORKS_STEPS.length - 1}
          >
            <HowItWorksStepContent step={def.step} extras={def.extras} />
          </HowItWorksTimelineStep>
        ))}
      </div>

      <section className={cn(publicPageUi.sectionGap, "border-t border-neutral-200/80 pt-10 sm:pt-12 dark:border-neutral-800")}>
        <h2 className={cn(publicPageUi.sectionTitle, "mb-6 text-center sm:mb-8")}>
          {t("staticPages.howItWorks.trustTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          <div className={cn(publicPageUi.card, publicPageUi.cardPad)}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-950 dark:text-neutral-50">
              {t("staticPages.howItWorks.trust1Title")}
            </h3>
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {t("staticPages.howItWorks.trust1Body")}
            </p>
          </div>

          <div className={cn(publicPageUi.card, publicPageUi.cardPad)}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-950 dark:text-neutral-50">
              {t("staticPages.howItWorks.trust2Title")}
            </h3>
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {t("staticPages.howItWorks.trust2Body")}
            </p>
          </div>
        </div>
      </section>

      <section className={cn(publicPageUi.sectionGap, publicPageUi.ctaPanel)}>
        <h3 className="mb-2 text-2xl font-semibold tracking-[-0.02em] text-neutral-950 dark:text-neutral-50">
          {t("staticPages.howItWorks.ctaTitle")}
        </h3>
        <p className="mx-auto mb-6 max-w-xl text-neutral-700 dark:text-neutral-300">{t("staticPages.howItWorks.ctaBody")}</p>
        <Link to="/pricing" className={publicPageUi.ctaPrimary}>
          {t("staticPages.howItWorks.ctaPricing")}
        </Link>
      </section>
    </PublicPageShell>
  );
}

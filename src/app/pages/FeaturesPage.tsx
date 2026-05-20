import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { FeaturesPageHero } from "@/components/public/features/FeaturesPageHero";
import { FeatureShowcaseCard } from "@/components/public/features/FeatureShowcaseCard";
import { FeaturesProductMoments } from "@/components/public/features/FeaturesProductMoments";
import { FEATURES_PAGE_ITEMS } from "@/components/public/features/featuresPageConfig";
import { cn } from "@/lib/utils";

export function FeaturesPage() {
  const { t } = useTranslation();

  const items = useMemo(
    () =>
      FEATURES_PAGE_ITEMS.map((item) => ({
        ...item,
        title: t(`staticPages.features.f${item.id}Title`),
        description: t(`staticPages.features.f${item.id}Desc`),
        tag: t(`staticPages.features.${item.tagKey}`),
      })),
    [t],
  );

  const featured = items.filter((f) => f.featured);
  const standard = items.filter((f) => !f.featured);

  return (
    <PublicPageShell maxWidth="wide" contentClassName="pb-4">
      <FeaturesPageHero />

      <section className="relative">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          {featured.map((f, idx) => (
            <FeatureShowcaseCard
              key={f.id}
              title={f.title}
              description={f.description}
              tag={f.tag}
              Icon={f.Icon}
              visual={f.visual}
              featured
              index={idx}
            />
          ))}
        </div>
      </section>

      <section
        className={cn(
          "relative mt-8 rounded-2xl border border-neutral-200/50 bg-[#f3f1ed]/60 px-1 py-6 sm:mt-10 sm:rounded-3xl sm:px-2 sm:py-8",
          "dark:border-neutral-800/80 dark:bg-neutral-900/40",
        )}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {standard.map((f, idx) => (
            <FeatureShowcaseCard
              key={f.id}
              title={f.title}
              description={f.description}
              tag={f.tag}
              Icon={f.Icon}
              visual={f.visual}
              index={idx + featured.length}
            />
          ))}
        </div>
      </section>

      <FeaturesProductMoments />
    </PublicPageShell>
  );
}

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { FeaturesPageHero } from "@/components/public/features/FeaturesPageHero";
import { FeatureShowcaseCard } from "@/components/public/features/FeatureShowcaseCard";
import { FEATURES_PAGE_ITEMS } from "@/components/public/features/featuresPageConfig";
import { cn } from "@/lib/utils";
import { DeferredBelowFold, LazyBelowFold } from "@/lib/publicRouteDefer";
import { usePublicMountProbe } from "@/lib/publicMountProbe";

function FeaturesStandardGrid({
  items,
}: {
  items: Array<(typeof FEATURES_PAGE_ITEMS)[number] & { title: string; description: string; tag: string }>;
}) {
  return (
    <section
      className={cn(
        "relative mt-8 rounded-2xl border border-neutral-200/50 bg-[#f3f1ed]/60 px-1 py-6 sm:mt-10 sm:rounded-3xl sm:px-2 sm:py-8",
        "dark:border-neutral-800/80 dark:bg-neutral-900/40",
      )}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {items.map((f, idx) => (
          <FeatureShowcaseCard
            key={f.id}
            title={f.title}
            description={f.description}
            tag={f.tag}
            Icon={f.Icon}
            visual={f.visual}
            index={idx + 2}
          />
        ))}
      </div>
    </section>
  );
}

export function FeaturesPage() {
  usePublicMountProbe("FeaturesPage");
  const { t, i18n } = useTranslation();

  const items = useMemo(
    () =>
      FEATURES_PAGE_ITEMS.map((item) => ({
        ...item,
        title: t(`staticPages.features.f${item.id}Title`),
        description: t(`staticPages.features.f${item.id}Desc`),
        tag: t(`staticPages.features.${item.tagKey}`),
      })),
    [t, i18n.language],
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

      <DeferredBelowFold minHeight="22rem" rootMargin="320px 0px">
        <FeaturesStandardGrid items={standard} />
      </DeferredBelowFold>

      <LazyBelowFold
        load={() =>
          import("@/components/public/features/FeaturesProductMoments").then((m) => ({
            default: m.FeaturesProductMoments,
          }))
        }
        props={{}}
        minHeight="18rem"
        rootMargin="280px 0px"
      />
    </PublicPageShell>
  );
}

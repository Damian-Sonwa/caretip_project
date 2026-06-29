import { BarChart3, QrCode, Shield, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeatureMomentVisual } from "@/components/public/features/FeatureMomentVisual";
import { FEATURE_MOMENT_KEYS } from "@/components/public/features/featuresPageConfig";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";
import { usePublicScrollReveal } from "@/lib/usePublicScrollReveal";

const MOMENT_ICONS = {
  qr: QrCode,
  employee: Users,
  payouts: Shield,
  analytics: BarChart3,
} as const;

function FeatureMomentCard({
  momentKey,
  index,
}: {
  momentKey: (typeof FEATURE_MOMENT_KEYS)[number];
  index: number;
}) {
  const { t } = useTranslation();
  const Icon = MOMENT_ICONS[momentKey];
  const reveal = usePublicScrollReveal<HTMLDivElement>(index * 0.05);

  return (
    <div
      ref={reveal.ref}
      style={reveal.style}
      className={cn(
        reveal.className,
        "caretip-features-moment-card group overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-sm transition-[box-shadow,border-color] duration-300",
        "hover:border-primary/15 hover:shadow-[0_10px_36px_-14px_rgba(15,23,42,0.12)]",
      )}
    >
      <FeatureMomentVisual moment={momentKey} className="m-0 rounded-none border-0 border-b border-border/60" />
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold text-foreground">
            {t(`staticPages.features.moments.${momentKey}.title`)}
          </h3>
        </div>
        {t(`staticPages.features.moments.${momentKey}.subtitle`) ? (
          <p className="mb-1.5 text-xs font-semibold text-foreground/90">
            {t(`staticPages.features.moments.${momentKey}.subtitle`)}
          </p>
        ) : null}
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(`staticPages.features.moments.${momentKey}.body`)}
        </p>
      </div>
    </div>
  );
}

export function FeaturesProductMoments() {
  const { t } = useTranslation();

  return (
    <section className="caretip-features-moments mt-10 sm:mt-12">
      <div className="caretip-features-moments__header mb-6 text-center sm:mb-8">
        <h2 className={publicPageUi.marketingSectionTitle}>{t("staticPages.features.momentsTitle")}</h2>
        <p className={cn(publicPageUi.marketingSectionSubtitle, "mx-auto mt-2 max-w-xl")}>
          {t("staticPages.features.momentsSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {FEATURE_MOMENT_KEYS.map((key, idx) => (
          <FeatureMomentCard key={key} momentKey={key} index={idx} />
        ))}
      </div>
    </section>
  );
}

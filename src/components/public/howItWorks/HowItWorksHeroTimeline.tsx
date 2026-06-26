import { BarChart3, QrCode, Smartphone, UserPlus } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { HOW_IT_WORKS_HERO_TIMELINE_STEPS } from "@/components/public/howItWorks/howItWorksHeroConfig";
import { cn } from "@/lib/utils";

const TIMELINE_ICONS = {
  signup: UserPlus,
  setup: QrCode,
  tips: Smartphone,
  track: BarChart3,
} as const;

type HowItWorksHeroTimelineProps = {
  className?: string;
};

export function HowItWorksHeroTimeline({ className }: HowItWorksHeroTimelineProps) {
  const { t } = useTranslation();
  const ns = "staticPages.howItWorks.hero.timeline";

  return (
    <ol className={cn("caretip-how-hero-v2__timeline", className)} aria-label={t(`${ns}.aria`)}>
      {HOW_IT_WORKS_HERO_TIMELINE_STEPS.map((step, index) => {
        const Icon = TIMELINE_ICONS[step.icon];
        return (
          <li
            key={step.id}
            className="caretip-how-hero-v2__timeline-step caretip-how-hero-v2__anim"
            style={{ animationDelay: `${280 + index * 55}ms` } as CSSProperties}
          >
            <div className="caretip-how-hero-v2__timeline-card">
              <span className="caretip-how-hero-v2__timeline-icon" aria-hidden>
                <Icon className="size-[1.125rem]" strokeWidth={2.1} />
              </span>
              <div className="min-w-0">
                <p className="caretip-how-hero-v2__timeline-title">{t(`${ns}.${step.id}.title`)}</p>
                <p className="caretip-how-hero-v2__timeline-desc">{t(`${ns}.${step.id}.description`)}</p>
              </div>
            </div>
            {index < HOW_IT_WORKS_HERO_TIMELINE_STEPS.length - 1 ? (
              <span className="caretip-how-hero-v2__timeline-connector" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

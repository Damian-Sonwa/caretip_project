import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CaretipPremiumBackdrop } from "@/app/components/premium/CaretipPremiumBackdrop";
import { premiumVisualClasses } from "@/lib/premiumVisualTokens";
import type { HeroPersonality } from "@/lib/heroPersonalitySystem";
import { heroPersonalityDataAttr } from "@/lib/heroPersonalitySystem";
import { cn } from "@/lib/utils";

type BusinessModuleWorkspaceHeaderProps = {
  badge: string;
  feature?: ReactNode;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  className?: string;
  actions?: ReactNode;
  /** Section personality — unique atmosphere while sharing premium gradient foundation. */
  personality?: HeroPersonality;
  statusBadge?: ReactNode;
  insightBadge?: ReactNode;
  premiumIndicator?: ReactNode;
};

/** Premium workspace hero — section label → title → purpose hierarchy before module sub-nav. */
export function BusinessModuleWorkspaceHeader({
  badge,
  feature,
  icon: Icon,
  title,
  subtitle,
  className,
  actions,
  personality = "team",
  statusBadge,
  insightBadge,
  premiumIndicator,
}: BusinessModuleWorkspaceHeaderProps) {
  return (
    <header
      className={cn(
        premiumVisualClasses.workspaceHeader,
        "business-module-workspace-header mb-3 max-lg:mb-2.5",
        className,
      )}
      {...heroPersonalityDataAttr(personality)}
    >
      <CaretipPremiumBackdrop personality={personality} />
      <div className="premium-workspace-header__inner">
        <div className="premium-workspace-header__head">
          <div className="premium-workspace-header__identity min-w-0 flex-1">
            <div className="premium-workspace-header__label-row">
              <span className="premium-workspace-header__section-label">{badge}</span>
              {feature ? (
                <span className="premium-workspace-header__feature">{feature}</span>
              ) : null}
              {statusBadge ? (
                <span className="premium-workspace-header__meta-pill">{statusBadge}</span>
              ) : null}
              {insightBadge ? (
                <span className="premium-workspace-header__meta-pill">{insightBadge}</span>
              ) : null}
              {premiumIndicator ? (
                <span className="premium-workspace-header__meta-pill">{premiumIndicator}</span>
              ) : null}
            </div>

            <div className="premium-workspace-header__title-row">
              <div className="premium-workspace-header__icon" aria-hidden>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="premium-workspace-header__title">{title}</h1>
                <p className="premium-workspace-header__purpose">{subtitle}</p>
              </div>
            </div>
          </div>

          {actions ? <div className="premium-workspace-header__actions">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}

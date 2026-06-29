import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { HeroPersonality } from "@/lib/heroPersonalitySystem";
import { dashboardWorkspaceUi } from "@/app/components/dashboard/dashboardWorkspaceUi";
import { cn } from "@/lib/utils";

type BusinessModuleWorkspaceHeaderProps = {
  badge: string;
  feature?: ReactNode;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  className?: string;
  actions?: ReactNode;
  /** @deprecated Decorative personalities removed — kept for API compatibility. */
  personality?: HeroPersonality;
  statusBadge?: ReactNode;
  insightBadge?: ReactNode;
  premiumIndicator?: ReactNode;
};

/** Flat module page header — typography hierarchy only. */
export function BusinessModuleWorkspaceHeader({
  badge,
  feature,
  icon: _Icon,
  title,
  subtitle,
  className,
  actions,
  statusBadge,
  insightBadge,
  premiumIndicator,
}: BusinessModuleWorkspaceHeaderProps) {
  const metaPills = [feature, statusBadge, insightBadge, premiumIndicator].filter(Boolean);

  return (
    <header
      className={cn(
        dashboardWorkspaceUi.moduleHeader,
        "business-module-workspace-header premium-workspace-header",
        className,
      )}
    >
      <div className={dashboardWorkspaceUi.moduleHeaderRow}>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={dashboardWorkspaceUi.eyebrow}>{badge}</span>
            {metaPills.map((pill, index) => (
              <span key={index} className="text-xs text-muted-foreground">
                {pill}
              </span>
            ))}
          </div>
          <h1 className={dashboardWorkspaceUi.pageTitle}>{title}</h1>
          <p className={dashboardWorkspaceUi.pageDescription}>{subtitle}</p>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

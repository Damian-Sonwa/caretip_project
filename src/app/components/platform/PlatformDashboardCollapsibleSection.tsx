import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type PlatformDashboardSectionId =
  | "platformOverview"
  | "systemHealth"
  | "subscriptionOverview"
  | "subscriptionActivity"
  | "businessOverview"
  | "revenueAnalytics"
  | "commercialIntelligence"
  | "verificationQueue";

export const PLATFORM_DASHBOARD_SECTION_DEFAULTS: Record<PlatformDashboardSectionId, boolean> = {
  platformOverview: true,
  systemHealth: true,
  subscriptionOverview: true,
  subscriptionActivity: false,
  businessOverview: false,
  revenueAnalytics: false,
  commercialIntelligence: false,
  verificationQueue: false,
};

type PlatformDashboardCollapsibleSectionProps = {
  sectionId: PlatformDashboardSectionId;
  title: string;
  description?: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  headerAction?: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Keep section content mounted when collapsed to preserve state and avoid refetch. */
  keepMounted?: boolean;
  children: ReactNode;
};

export function PlatformDashboardCollapsibleSection({
  sectionId,
  title,
  description,
  expanded,
  onExpandedChange,
  headerAction,
  className,
  contentClassName,
  keepMounted = true,
  children,
}: PlatformDashboardCollapsibleSectionProps) {
  const contentId = useId();
  const triggerId = useId();

  return (
    <Collapsible
      open={expanded}
      onOpenChange={onExpandedChange}
      data-section={sectionId}
      className={cn("platform-dashboard-section mb-6", className)}
    >
      <div className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-sm">
        <CollapsibleTrigger
          id={triggerId}
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          className={cn(
            "flex w-full min-h-[52px] touch-manipulation items-center gap-3 border-b border-border bg-muted/40 px-4 py-3.5 text-left transition-colors",
            "hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            !expanded && "border-b-0",
          )}
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-snug text-foreground sm:text-lg">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs font-medium leading-relaxed text-muted-foreground sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {headerAction ? (
            <div
              className="shrink-0"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {headerAction}
            </div>
          ) : null}
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-[220ms] ease-out",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </CollapsibleTrigger>
        <CollapsibleContent
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          forceMount={keepMounted || undefined}
          className="platform-dashboard-section__content overflow-hidden"
        >
          <div
            className={cn(
              "px-4 py-4 sm:px-5 sm:py-5",
              !expanded && keepMounted && "hidden",
              contentClassName,
            )}
            aria-hidden={!expanded}
          >
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function usePlatformDashboardSectionState() {
  const [expandedSections, setExpandedSections] = useState<Record<PlatformDashboardSectionId, boolean>>(
    () => ({ ...PLATFORM_DASHBOARD_SECTION_DEFAULTS }),
  );

  const setSectionExpanded = (sectionId: PlatformDashboardSectionId, open: boolean) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: open }));
  };

  return { expandedSections, setSectionExpanded };
}

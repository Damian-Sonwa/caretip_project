import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Lock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { businessUi } from "@/app/components/business/businessDashboardUi";

export type BusinessModuleSubNavItem = {
  labelKey: string;
  href: string;
  locked?: boolean;
  icon?: LucideIcon;
};

type BusinessModuleSubNavProps = {
  items: readonly BusinessModuleSubNavItem[];
  ariaLabelKey: string;
  className?: string;
};

export function BusinessModuleSubNav({ items, ariaLabelKey, className }: BusinessModuleSubNavProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className={cn("business-module-sub-nav", className)} aria-label={t(ariaLabelKey)}>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scroll-px-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "inline-flex min-h-[44px] shrink-0 snap-start touch-manipulation items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary/30 bg-primary/[0.06] text-foreground"
                  : cn(businessUi.cardStatic, "text-muted-foreground hover:text-foreground"),
              )}
              aria-current={active ? "page" : undefined}
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden /> : null}
              <span>{t(item.labelKey)}</span>
              {item.locked ? (
                <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

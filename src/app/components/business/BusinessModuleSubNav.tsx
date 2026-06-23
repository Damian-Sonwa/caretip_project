import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { businessUi } from "@/app/components/business/businessDashboardUi";

export type BusinessModuleSubNavItem = {
  labelKey: string;
  href: string;
  locked?: boolean;
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
    <nav className={cn("mb-6", className)} aria-label={t(ariaLabelKey)}>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary/30 bg-primary/[0.06] text-foreground"
                  : cn(businessUi.cardStatic, "text-muted-foreground hover:text-foreground"),
              )}
              aria-current={active ? "page" : undefined}
            >
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

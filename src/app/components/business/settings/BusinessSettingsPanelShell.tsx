import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { businessUi } from "@/app/components/business/businessDashboardUi";

export function BusinessSettingsPanelShell({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const showHeader = Boolean(title || description);

  return (
    <section
      className={cn(businessUi.cardStatic, businessUi.settingsPanel, "p-5 sm:p-6", className)}
    >
      {showHeader ? (
        <header className="mb-6 border-b border-neutral-100/90 pb-5">
          {title ? (
            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
          ) : null}
          {description ? (
            <p className={cn(title ? "mt-1.5" : "", "max-w-2xl", businessUi.cardDesc)}>{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

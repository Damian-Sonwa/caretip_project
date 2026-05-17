import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BusinessSettingsPanelShell({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border-2 border-border bg-card p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      <header className="mb-6 border-b border-border/60 pb-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

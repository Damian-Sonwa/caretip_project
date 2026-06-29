import type { ReactNode } from "react";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

type PublicLegalPageShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function PublicLegalPageShell({ title, subtitle, children }: PublicLegalPageShellProps) {
  return (
    <PublicPageShell>
      <PublicPageHeader title={title} subtitle={subtitle} />
      <div
        className={cn(
          publicPageUi.sectionGap,
          publicPageUi.card,
          publicPageUi.cardPad,
          publicPageUi.legalProse,
        )}
      >
        {children}
      </div>
    </PublicPageShell>
  );
}

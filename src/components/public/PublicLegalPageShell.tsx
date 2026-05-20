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
          "prose prose-neutral max-w-none text-neutral-700 prose-headings:font-hero-display prose-headings:font-bold prose-headings:tracking-[-0.02em] prose-headings:text-neutral-950 prose-p:leading-relaxed prose-li:leading-relaxed dark:prose-invert dark:text-neutral-300 dark:prose-headings:text-neutral-50",
        )}
      >
        {children}
      </div>
    </PublicPageShell>
  );
}

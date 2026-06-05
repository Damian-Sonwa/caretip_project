import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { publicPageUi } from "@/components/public/publicPageUi";
import { PublicPageBackLink } from "@/components/public/PublicPageBackLink";
import { PublicTrustChips } from "@/components/public/PublicTrustChips";

type PublicPageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  afterSubtitle?: ReactNode;
  showTrustChips?: boolean;
  centered?: boolean;
  /** When `centered`, `stack` left-aligns title, subtitle, and `afterSubtitle` in one column. */
  introLayout?: "center" | "stack";
  className?: string;
};

export function PublicPageHeader({
  title,
  subtitle,
  afterSubtitle,
  showTrustChips = false,
  centered = false,
  introLayout = "center",
  className,
}: PublicPageHeaderProps) {
  return (
    <header className={cn(publicPageUi.header, centered && "text-center", className)}>
      <PublicPageBackLink />

      <div
        className={cn(
          "space-y-3 sm:space-y-4",
          centered && "mx-auto w-full max-w-2xl",
          centered && introLayout === "center" && "flex flex-col items-center text-center",
          centered && introLayout === "stack" && "flex flex-col items-start text-left",
        )}
      >
        <h1 className={cn(publicPageUi.title, centered && "w-full")}>{title}</h1>
        {subtitle ? (
          <p className={cn(publicPageUi.subtitle, centered && "w-full max-w-none")}>{subtitle}</p>
        ) : null}
        {afterSubtitle ? (
          <div
            className={cn(
              "w-full",
              centered && introLayout === "center" && "flex justify-center",
            )}
          >
            {afterSubtitle}
          </div>
        ) : null}
        {showTrustChips ? (
          <PublicTrustChips className={cn("pt-1", centered && "justify-center")} />
        ) : null}
      </div>
    </header>
  );
}

import type { ReactNode } from "react";
import { Navigation } from "@/app/components/Navigation";
import { Footer } from "@/app/components/Footer";
import { AuthLikePageBackground } from "@/app/components/AuthLikePageBackground";
import { cn } from "@/lib/utils";
import { publicPageUi } from "@/components/public/publicPageUi";

type PublicPageShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: "prose" | "wide" | "pricing" | "full";
};

const maxWidthClass = {
  prose: publicPageUi.proseWrap,
  wide: publicPageUi.wideWrap,
  pricing: publicPageUi.pricingWrap,
  full: "mx-auto w-full max-w-[100rem]",
} as const;

export function PublicPageShell({
  children,
  className,
  contentClassName,
  maxWidth = "prose",
}: PublicPageShellProps) {
  return (
    <div className={publicPageUi.page}>
      <AuthLikePageBackground />
      <div className={publicPageUi.shell}>
        <Navigation />
        <main className={cn(publicPageUi.main, maxWidthClass[maxWidth], className)}>
          <div className={contentClassName}>{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

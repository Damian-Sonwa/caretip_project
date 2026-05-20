import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { publicPageUi } from "@/components/public/publicPageUi";
import { PublicTrustChips } from "@/components/public/PublicTrustChips";

type PublicPageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  showTrustChips?: boolean;
  centered?: boolean;
  className?: string;
};

export function PublicPageHeader({
  title,
  subtitle,
  showTrustChips = false,
  centered = false,
  className,
}: PublicPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className={cn(publicPageUi.header, centered && "text-center", className)}>
      <Link to="/" className={publicPageUi.backLink}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span>{t("staticPages.common.backToHome")}</span>
      </Link>

      <div className={cn("space-y-3", centered && "mx-auto flex flex-col items-center")}>
        <h1 className={cn(publicPageUi.title, centered && "mx-auto max-w-3xl text-center")}>{title}</h1>
        {subtitle ? (
          <p className={cn(publicPageUi.subtitle, centered && "mx-auto text-center")}>{subtitle}</p>
        ) : null}
        {showTrustChips ? (
          <PublicTrustChips className={cn("pt-1", centered && "justify-center")} />
        ) : null}
      </div>
    </header>
  );
}

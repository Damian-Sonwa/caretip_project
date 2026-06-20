import type { ImgHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import dashboardImg from "../../../../images/new_dashboard.png";
import { PublicTrustChips } from "@/components/public/PublicTrustChips";
import { PublicPageBackLink } from "@/components/public/PublicPageBackLink";
import { cn } from "@/lib/utils";
import { publicPageUi } from "@/components/public/publicPageUi";
import { usePublicMountProbe } from "@/lib/publicMountProbe";

export function FeaturesPageHero() {
  usePublicMountProbe("FeaturesPageHero");
  const { t } = useTranslation();

  return (
    <header className={cn(publicPageUi.header, "relative mb-2 sm:mb-4")}>
      <PublicPageBackLink className="relative z-[2]" />

      <div
        className={cn(
          "caretip-public-hero-enter relative overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/80 shadow-[0_12px_48px_-24px_rgba(15,23,42,0.14)] sm:rounded-3xl dark:border-neutral-800 dark:bg-neutral-950/70",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(250,249,247,0.9)_0%,rgba(255,255,255,0.85)_48%,rgba(247,243,238,0.92)_100%)] dark:bg-[linear-gradient(180deg,rgba(10,10,10,0.92)_0%,rgba(20,20,20,0.88)_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(120,113,105,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(120,113,105,0.06)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 top-0 h-full w-[min(72%,420px)] bg-[radial-gradient(ellipse_at_70%_30%,rgba(233,120,28,0.14),transparent_62%)]"
        />
        <img
          src={dashboardImg}
          alt=""
          className="pointer-events-none absolute -right-6 top-6 w-[min(55%,320px)] rounded-2xl object-cover opacity-[0.14] blur-[2px] dark:opacity-[0.08]"
          loading="eager"
          {...({ fetchpriority: "low" } as ImgHTMLAttributes<HTMLImageElement>)}
          decoding="async"
        />

        <div className="relative z-[1] flex flex-col items-center px-5 py-8 text-center sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <h1 className={cn(publicPageUi.title, "mx-auto max-w-3xl text-balance")}>
            {t("staticPages.features.title")}
          </h1>
          <div className="mx-auto mt-4 flex w-full max-w-2xl flex-col gap-4">
            <p className={cn(publicPageUi.subtitle, "text-balance font-semibold text-neutral-900 dark:text-neutral-100")}>
              {t("staticPages.features.subtitleLead")}
            </p>
            <p className={cn(publicPageUi.subtitle, "text-pretty leading-[1.7]")}>
              {t("staticPages.features.subtitleBody")}
            </p>
          </div>
          <div className="mx-auto mt-5 inline-flex max-w-full flex-wrap justify-center gap-2 rounded-2xl border border-neutral-200/60 bg-white/70 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm dark:border-neutral-700/80 dark:bg-neutral-900/50">
            <PublicTrustChips variant="features" className="justify-center gap-2" />
          </div>
        </div>
      </div>
    </header>
  );
}

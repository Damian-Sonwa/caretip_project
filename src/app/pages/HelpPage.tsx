import { Link } from "react-router";
import { useMemo, useState } from "react";
import {
  Search,
  Book,
  Video,
  MessageCircle,
  HelpCircle,
  CreditCard,
  Bell,
  Users,
  QrCode,
  Wallet,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

type HelpCategoryId =
  | "gettingStarted"
  | "qrGuests"
  | "tipsPayments"
  | "payoutsEarnings"
  | "notifications"
  | "staffLocations"
  | "troubleshooting";

const HELP_CATEGORY_ORDER: { id: HelpCategoryId; icon: LucideIcon }[] = [
  { id: "gettingStarted", icon: Book },
  { id: "qrGuests", icon: QrCode },
  { id: "tipsPayments", icon: CreditCard },
  { id: "payoutsEarnings", icon: Wallet },
  { id: "notifications", icon: Bell },
  { id: "staffLocations", icon: Users },
  { id: "troubleshooting", icon: HelpCircle },
];

function readArticles(t: TFunction, id: HelpCategoryId): string[] {
  const raw = t(`staticPages.help.categories.${id}.articles`, { returnObjects: true });
  return Array.isArray(raw) ? (raw as string[]) : [];
}

export function HelpPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = useMemo(
    () =>
      HELP_CATEGORY_ORDER.map((def) => ({
        id: def.id,
        icon: def.icon,
        title: t(`staticPages.help.categories.${def.id}.title`),
        articles: readArticles(t, def.id),
      })),
    [t],
  );

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return helpCategories;
    return helpCategories
      .map((cat) => {
        const titleMatch = cat.title.toLowerCase().includes(q);
        const articles = titleMatch ? cat.articles : cat.articles.filter((a) => a.toLowerCase().includes(q));
        return { ...cat, articles };
      })
      .filter((cat) => cat.articles.length > 0);
  }, [helpCategories, searchQuery]);

  return (
    <PublicPageShell maxWidth="wide">
      <PublicPageHeader
        centered
        showTrustChips
        title={t("staticPages.help.title")}
        subtitle={t("staticPages.help.subtitle")}
      />

      <div className={cn(publicPageUi.sectionGap, "relative mx-auto max-w-2xl")}>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("staticPages.help.searchPlaceholder")}
          autoComplete="off"
          aria-label={t("staticPages.help.searchAria")}
          className="w-full rounded-xl border border-neutral-200/90 bg-white py-3.5 pl-12 pr-4 text-neutral-900 placeholder:text-neutral-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />
      </div>

      <div className={cn(publicPageUi.sectionGap, "grid grid-cols-1 gap-4 sm:grid-cols-3")}>
        {[
          { to: "/faq", Icon: HelpCircle, title: t("staticPages.help.cardFaqTitle"), desc: t("staticPages.help.cardFaqDesc") },
          { Icon: Video, title: t("staticPages.help.cardVideoTitle"), desc: t("staticPages.help.cardVideoDesc"), static: true },
          { to: "/contact", Icon: MessageCircle, title: t("staticPages.help.cardContactTitle"), desc: t("staticPages.help.cardContactDesc") },
        ].map(({ to, Icon, title, desc, static: isStatic }) => {
          const inner = (
            <>
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold text-neutral-950 dark:text-neutral-50">{title}</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{desc}</p>
            </>
          );

          const className = cn(
            publicPageUi.card,
            publicPageUi.cardPad,
            "group text-center transition-colors hover:border-primary/20",
            isStatic && "cursor-default",
          );

          return to ? (
            <Link key={title} to={to} className={className}>
              {inner}
            </Link>
          ) : (
            <div key={title} className={className}>
              {inner}
            </div>
          );
        })}
      </div>

      <section className={publicPageUi.sectionGap}>
        <h2 className="mb-5 text-xl font-semibold text-neutral-950 sm:text-2xl dark:text-neutral-50">
          {t("staticPages.help.browseTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full py-10 text-center text-neutral-600 dark:text-neutral-400">
              {t("staticPages.help.noResults")}{" "}
              <button
                type="button"
                className="font-medium text-primary underline underline-offset-2"
                onClick={() => setSearchQuery("")}
              >
                {t("staticPages.help.clearSearch")}
              </button>
              .
            </div>
          ) : (
            filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className={cn(publicPageUi.card, publicPageUi.cardPad, "hover:border-primary/15")}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-neutral-950 dark:text-neutral-50">{category.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex}>
                        <a
                          href="#"
                          className="group flex items-center gap-2 text-sm text-neutral-700 transition-colors hover:text-primary dark:text-neutral-300"
                        >
                          <span className="h-1 w-1 rounded-full bg-neutral-400 transition-colors group-hover:bg-primary" />
                          {article}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className={cn(publicPageUi.sectionGap, publicPageUi.ctaPanel)}>
        <h3 className="mb-2 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">{t("staticPages.help.ctaTitle")}</h3>
        <p className="mx-auto mb-6 max-w-lg text-neutral-700 dark:text-neutral-300">{t("staticPages.help.ctaBody")}</p>
        <Link to="/contact" className={publicPageUi.ctaPrimary}>
          {t("staticPages.help.ctaButton")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </PublicPageShell>
  );
}

import { Link } from "react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
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
  type LucideIcon,
} from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import AnimatedShaderBackground from "../components/ui/animated-shader-background";

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
    <div className="min-h-screen relative">
      <AnimatedShaderBackground />
      <div className="relative z-10">
        <Navigation />

        <main className="min-h-[70vh] px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{t("staticPages.common.backToHome")}</span>
            </Link>

            <div className="space-y-8">
              <div className="space-y-4 text-center">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">{t("staticPages.help.title")}</h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">{t("staticPages.help.subtitle")}</p>
              </div>

              <div className="max-w-2xl mx-auto pt-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("staticPages.help.searchPlaceholder")}
                    autoComplete="off"
                    aria-label={t("staticPages.help.searchAria")}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
                <Link
                  to="/faq"
                  className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/20 transition-colors">
                    <HelpCircle className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{t("staticPages.help.cardFaqTitle")}</h3>
                  <p className="text-sm text-muted-foreground">{t("staticPages.help.cardFaqDesc")}</p>
                </Link>

                <div className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all text-center group cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/20 transition-colors">
                    <Video className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{t("staticPages.help.cardVideoTitle")}</h3>
                  <p className="text-sm text-muted-foreground">{t("staticPages.help.cardVideoDesc")}</p>
                </div>

                <Link
                  to="/contact"
                  className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all text-center group"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/20 transition-colors">
                    <MessageCircle className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{t("staticPages.help.cardContactTitle")}</h3>
                  <p className="text-sm text-muted-foreground">{t("staticPages.help.cardContactDesc")}</p>
                </Link>
              </div>

              <div className="pt-8">
                <h2 className="text-2xl font-semibold text-foreground mb-6">{t("staticPages.help.browseTitle")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCategories.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                      {t("staticPages.help.noResults")}{" "}
                      <button
                        type="button"
                        className="font-medium text-accent underline underline-offset-2"
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
                        <div
                          key={category.id}
                          className="p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-accent" />
                            </div>
                            <h3 className="font-semibold text-foreground">{category.title}</h3>
                          </div>
                          <ul className="space-y-2">
                            {category.articles.map((article, articleIndex) => (
                              <li key={articleIndex}>
                                <a
                                  href="#"
                                  className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-2 group"
                                >
                                  <span className="w-1 h-1 rounded-full bg-muted-foreground group-hover:bg-accent transition-colors" />
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
              </div>

              <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 text-center">
                <h3 className="text-2xl font-semibold text-foreground mb-3">{t("staticPages.help.ctaTitle")}</h3>
                <p className="text-muted-foreground mb-6">{t("staticPages.help.ctaBody")}</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-all"
                >
                  {t("staticPages.help.ctaButton")}
                  <MessageCircle className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

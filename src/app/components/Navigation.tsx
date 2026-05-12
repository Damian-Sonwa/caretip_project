import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CareTipLogo } from "./CareTipLogo";
import { useTheme } from "../context/ThemeContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

const NAV_ROUTES = [
  { to: "/how-it-works" as const, nameKey: "nav.howItWorks" },
  { to: "/features" as const, nameKey: "nav.features" },
  { to: "/pricing" as const, nameKey: "nav.fees" },
] as const;

export type NavigationVariant = "default" | "dark";

export function Navigation({ variant = "default" }: { variant?: NavigationVariant }) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { mode } = useTheme();
  const isDark = mode === "dark" || variant === "dark";

  const navLinks = useMemo(
    () => NAV_ROUTES.map((r) => ({ ...r, label: t(r.nameKey) })),
    [t],
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const linkClass =
    "text-sm font-semibold transition-colors hover:opacity-80 active:opacity-70 rounded-md px-1 py-1";

  const headerSurface = "border-b border-border/60 bg-background/95 backdrop-blur-md";

  return (
    <header
      className={cn(
        "sticky top-0 left-0 right-0 z-50 w-full max-w-[100vw] overflow-x-clip overflow-y-visible",
        headerSurface,
      )}
    >
      <nav
        className="relative mx-auto max-w-7xl min-h-0 min-w-0 px-4 py-3 sm:px-6 sm:py-4"
        aria-label={t("nav.mainNav")}
      >
        <div className="relative z-50 flex min-h-0 min-w-0 max-w-full items-center justify-between gap-2 sm:gap-4">
          <Link
            to="/"
            className={cn(
              "relative z-[1] flex h-16 min-h-[3.75rem] min-w-0 flex-1 items-center overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-[3.5rem] sm:min-h-[3.5rem] md:h-16 md:min-h-[4rem] xl:h-[4.25rem] xl:min-h-[4.25rem]",
              "max-w-[calc(100%-3.25rem)] md:min-w-[10rem] lg:max-w-[min(560px,92vw)] lg:min-w-[12rem] lg:flex-none lg:shrink-0 xl:min-w-[14rem]",
              "touch-manipulation",
              isDark && "rounded-xl bg-card px-2 py-1 shadow-sm ring-1 ring-border/60",
            )}
          >
            <CareTipLogo size="header" layoutIsolatedDouble />
          </Link>

          <div className="hidden items-center gap-8 lg:flex xl:gap-10">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={cn(linkClass, "text-foreground")}>
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher />
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/login">
                <button
                  type="button"
                  className={cn(
                    "rounded-lg border-2 px-4 py-2 text-sm font-bold transition-[colors,opacity,box-shadow] active:opacity-90",
                    "border-primary bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {t("nav.logIn")}
                </button>
              </Link>
              <Link to="/contact">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md transition-[colors,opacity,box-shadow] hover:bg-primary-hover active:opacity-90"
                >
                  {t("nav.requestDemo")}
                </button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMobileMenuOpen((o) => !o);
              }}
              className={cn(
                "relative z-[100] shrink-0 touch-manipulation rounded-lg p-2.5 transition-colors active:opacity-90",
                "hover:bg-muted/80 active:bg-muted",
              )}
              style={{ color: "hsl(var(--foreground))" }}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-main-nav"
              aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                key="mobile-nav-backdrop"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("fixed inset-0 z-40 lg:hidden", "bg-black/40")}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                key="mobile-nav-panel"
                id="mobile-main-nav"
                role="dialog"
                aria-modal="true"
                aria-label={t("nav.mainNav")}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "caretip-public-mobile-nav-drawer absolute left-0 right-0 top-full z-[60] border-b shadow-[0_12px_40px_rgba(0,0,0,0.08)] lg:hidden",
                  "border-border/60 bg-background/98 backdrop-blur-md",
                )}
              >
                <div className="flex flex-col gap-2.5 px-4 py-4 sm:px-6">
                  <div className="caretip-public-mobile-nav-links flex flex-col gap-2.5">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                          "text-foreground active:bg-muted",
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <div
                    className={cn(
                      "caretip-public-mobile-nav-actions mt-1 flex flex-col gap-2.5 border-t pt-4",
                      "border-border/60",
                    )}
                  >
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex w-fit max-w-full shrink-0"
                    >
                      <button
                        type="button"
                        className={cn(
                          "inline-flex min-h-10 w-auto max-w-full touch-manipulation items-center justify-center whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition-[colors,opacity,box-shadow] active:opacity-90",
                          "border-border/80 bg-muted/40 text-foreground hover:bg-muted/70",
                        )}
                      >
                        {t("nav.signIn")}
                      </button>
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-flex w-fit max-w-full shrink-0"
                    >
                      <button
                        type="button"
                        className={cn(
                          "inline-flex min-h-10 w-auto max-w-full touch-manipulation items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-primary-foreground transition-[colors,opacity,box-shadow] hover:bg-primary-hover active:opacity-90",
                          "bg-primary shadow-sm",
                        )}
                      >
                        {t("nav.requestDemo")}
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

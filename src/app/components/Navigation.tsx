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
    "text-sm font-semibold text-neutral-800 transition-colors hover:text-primary active:opacity-85 rounded-lg px-2 py-1.5 hover:bg-neutral-900/[0.04] dark:text-neutral-100 dark:hover:bg-white/[0.06]";

  const headerSurface = cn(
    "border-b border-stone-200/88 dark:border-neutral-700/75",
    "bg-white/72 backdrop-blur-xl dark:bg-neutral-950/75",
    "shadow-[0_6px_32px_-18px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_32px_-16px_rgba(0,0,0,0.45)]",
  );

  return (
    <header
      className={cn(
        "sticky top-0 left-0 right-0 z-50 w-full max-w-[100vw] overflow-x-clip overflow-y-visible",
        headerSurface,
      )}
    >
      <nav
        className="relative mx-auto max-w-7xl min-h-0 min-w-0 px-4 py-2.5 sm:px-6 sm:py-4"
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
              <Link key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </Link>
            ))}
            <LanguageSwitcher />
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/login">
                <button
                  type="button"
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-semibold transition-[colors,opacity,box-shadow,transform] active:opacity-95",
                    "border-neutral-200/90 bg-white/70 text-neutral-900 shadow-none hover:border-primary/35 hover:bg-primary/[0.05] hover:shadow-[0_4px_18px_-12px_rgba(235,153,44,0.22)] dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-100 dark:hover:border-primary/45 dark:hover:bg-primary/[0.08]",
                  )}
                >
                  {t("nav.logIn")}
                </button>
              </Link>
              <Link to="/contact">
                <button
                  type="button"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_rgba(235,153,44,0.45)] transition-[colors,opacity,box-shadow,transform] hover:bg-primary-hover hover:shadow-[0_10px_28px_-8px_rgba(235,153,44,0.5)] active:opacity-95"
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
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "fixed inset-0 z-40 lg:hidden",
                  "bg-neutral-950/[0.28] backdrop-blur-[3px] dark:bg-black/50",
                )}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                key="mobile-nav-panel"
                id="mobile-main-nav"
                role="dialog"
                aria-modal="true"
                aria-label={t("nav.mainNav")}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "caretip-public-mobile-nav-drawer absolute left-0 right-0 top-full z-[60] border-b lg:hidden",
                  "border-border/50 bg-background/[0.97] shadow-[0_16px_48px_-12px_rgba(15,23,42,0.14)] backdrop-blur-xl dark:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.55)]",
                )}
              >
                <div className="flex flex-col gap-1 px-4 py-3 sm:px-5 sm:py-3.5">
                  <div className="caretip-public-mobile-nav-links flex flex-col gap-0.5">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={cn(
                          "flex min-h-11 w-full items-center rounded-xl px-3 text-[1.0625rem] font-semibold tracking-tight transition-colors active:bg-muted/90",
                          "text-foreground hover:bg-muted/60",
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <div
                    className={cn(
                      "caretip-public-mobile-nav-actions mt-2 flex flex-col gap-2 border-t pt-3",
                      "border-border/55",
                    )}
                  >
                    <Link
                      to="/contact"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full"
                    >
                      <button
                        type="button"
                        className={cn(
                          "inline-flex min-h-11 w-full touch-manipulation items-center justify-center whitespace-nowrap rounded-xl px-4 text-[1.0625rem] font-bold text-primary-foreground shadow-[0_8px_22px_-8px_rgba(235,153,44,0.45)] transition-[colors,opacity,box-shadow,transform] hover:bg-primary-hover active:scale-[0.99] active:opacity-95",
                          "bg-primary",
                        )}
                      >
                        {t("nav.requestDemo")}
                      </button>
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full"
                    >
                      <button
                        type="button"
                        className={cn(
                          "inline-flex min-h-11 w-full touch-manipulation items-center justify-center whitespace-nowrap rounded-xl border border-border/75 bg-muted/25 px-4 text-[1.0625rem] font-semibold text-foreground transition-[colors,opacity,box-shadow] active:opacity-90",
                          "hover:bg-muted/55",
                        )}
                      >
                        {t("nav.signIn")}
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

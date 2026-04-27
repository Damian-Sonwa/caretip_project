import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from "./CareTipLogo";
import { useTheme } from "../context/ThemeContext";

const navLinks = [
  { name: "How it Works", to: "/how-it-works" as const },
  { name: "Features", to: "/features" as const },
  { name: "Fees", to: "/pricing" as const },
] as const;

export type NavigationVariant = "default" | "dark";

export function Navigation({ variant = "default" }: { variant?: NavigationVariant }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark" || variant === "dark";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const linkClass =
    "text-sm font-semibold transition-colors hover:opacity-80 active:opacity-70 active:scale-[0.98] rounded-md px-1 py-1";

  const headerSurface = "border-b border-border/60 bg-background/95 backdrop-blur-md";

  return (
    <header
      className={cn(
        "sticky top-0 left-0 right-0 z-50 w-full max-w-[100vw] overflow-x-clip overflow-y-visible",
        headerSurface
      )}
    >
      <nav
        className="relative mx-auto max-w-7xl min-h-0 min-w-0 px-4 py-3 sm:px-6 sm:py-4"
        aria-label="Main"
      >
        <div className="relative z-50 flex min-h-0 min-w-0 max-w-full items-center justify-between gap-2 sm:gap-4">
          <Link
            to="/"
            className={cn(
              /* `flex-1` + `min-w-0` gives the logo a real width on mobile. At `lg`, `flex-none` would
                 collapse width to 0 because the wordmark is absolutely positioned (no intrinsic width).
                 `lg:min-w-*` reserves space so the mark stays visible on desktop/tablet.
                 No overflow-x-auto/scroll — clip only so the mark never creates a horizontal scrollport. */
              "relative z-[1] flex h-16 min-h-[3.75rem] min-w-0 flex-1 items-center overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-[3.5rem] sm:min-h-[3.5rem] md:h-16 md:min-h-[4rem] xl:h-[4.25rem] xl:min-h-[4.25rem]",
              "max-w-[calc(100%-3.25rem)] md:min-w-[10rem] lg:max-w-[min(560px,92vw)] lg:min-w-[12rem] lg:flex-none lg:shrink-0 xl:min-w-[14rem]",
              "touch-manipulation",
              isDark && "rounded-xl bg-card px-2 py-1 shadow-sm ring-1 ring-border/60",
            )}
          >
            <CareTipLogo size="header" layoutIsolatedDouble />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-10 xl:gap-12">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to as string}
                className={cn(linkClass, "text-foreground")}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted active:scale-[0.98]"
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={mode === "dark" ? "Light mode" : "Dark mode"}
            >
              {mode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link to="/login">
              <button
                type="button"
                className={cn(
                  "rounded-lg border-2 px-4 py-2 text-sm font-bold transition-all active:scale-[0.98]",
                  "border-primary bg-card text-foreground hover:bg-muted"
                )}
              >
                Log In
              </button>
            </Link>
            <Link to="/onboarding">
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary-hover active:scale-[0.98]"
              >
                Join CareTip
              </button>
            </Link>
          </div>

          {/* Mobile: hamburger — nav links open in panel below header */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileMenuOpen((o) => !o);
            }}
            className={cn(
              "relative z-[100] shrink-0 rounded-lg p-2.5 transition-colors active:scale-95 lg:hidden",
              "hover:bg-muted/80 active:bg-muted"
            )}
            style={{ color: "hsl(var(--foreground))" }}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-main-nav"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
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
                aria-label="Site navigation"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "absolute left-0 right-0 top-full z-[60] border-b shadow-[0_12px_40px_rgba(0,0,0,0.08)] lg:hidden",
                  "border-border/60 bg-background/98 backdrop-blur-md"
                )}
              >
                <div className="flex flex-col gap-1 px-4 py-4 sm:px-6">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">Appearance</p>
                    <button
                      type="button"
                      onClick={toggle}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm active:scale-[0.98]"
                      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    >
                      {mode === "dark" ? (
                        <>
                          <Sun className="h-4 w-4" />
                          Light
                        </>
                      ) : (
                        <>
                          <Moon className="h-4 w-4" />
                          Dark
                        </>
                      )}
                    </button>
                  </div>
                  {navLinks.map((link) =>
                    <Link
                      key={link.name}
                      to={link.to as string}
                      className={cn(
                        "rounded-lg px-3 py-3 text-base font-semibold transition-colors",
                        "text-foreground active:bg-muted"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  )}
                  <div
                    className={cn(
                      "mt-3 flex flex-col gap-3 border-t pt-4",
                      "border-border/60"
                    )}
                  >
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                      <button
                        type="button"
                        className={cn(
                          "w-full rounded-lg border-2 px-4 py-3 text-sm font-bold transition-all active:scale-[0.98]",
                          "border-primary bg-card text-foreground"
                        )}
                      >
                        Log In
                      </button>
                    </Link>
                    <Link to="/onboarding" onClick={() => setMobileMenuOpen(false)} className="w-full">
                      <button
                        type="button"
                        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary-hover active:scale-[0.98]"
                      >
                        Join CareTip
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

import { motion, AnimatePresence } from "motion/react";
import { Link, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CareTipLogo, CARE_TIP_LOGO_SURFACE_CLASS } from "./CareTipLogo";

const TEXT_BLACK = "#000000";

const navLinks = [
  { name: "How it Works", to: "/how-it-works" as const },
  { name: "Features", to: "/features" as const },
  { name: "Fees", to: "/pricing" as const },
] as const;

export type NavigationVariant = "default" | "dark";

export function Navigation({ variant = "default" }: { variant?: NavigationVariant }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isDark = variant === "dark";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  const linkClass =
    "text-sm font-semibold transition-colors hover:opacity-80 active:opacity-70 active:scale-[0.98] rounded-md px-1 py-1";

  const headerSurface = isDark
    ? "border-b border-white/10 bg-zinc-950/95 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.04)]"
    : "border-b border-[#F5F5F5] bg-white/95 backdrop-blur-md";

  const ink = isDark ? "#fafafa" : TEXT_BLACK;

  return (
    <header
      className={cn(
        "sticky top-0 left-0 right-0 z-50 w-full max-w-[100vw] overflow-x-clip overflow-y-visible",
        headerSurface
      )}
      style={{ color: ink }}
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
              isDark && "rounded-xl bg-white/95 px-2 py-1 shadow-sm ring-1 ring-white/20",
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
                className={linkClass}
                style={{ color: ink }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link to="/login">
              <button
                type="button"
                className={cn(
                  "rounded-lg border-2 px-4 py-2 text-sm font-bold transition-all active:scale-[0.98]",
                  isDark
                    ? "border-white/25 bg-white/5 text-zinc-100 hover:bg-white/10"
                    : "border-primary bg-white text-foreground hover:bg-muted"
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
              isDark ? "hover:bg-white/10 active:bg-white/15" : "hover:bg-muted/80 active:bg-muted"
            )}
            style={{ color: ink }}
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
                className={cn("fixed inset-0 z-40 lg:hidden", isDark ? "bg-black/60" : "bg-black/40")}
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
                  "absolute left-0 right-0 top-full z-[60] border-b shadow-lg lg:hidden",
                  isDark
                    ? "border-white/10 bg-zinc-950/98 backdrop-blur-md"
                    : "border-[#F5F5F5] bg-white/98 backdrop-blur-md"
                )}
              >
                <div className="flex flex-col gap-1 px-4 py-4 sm:px-6">
                  {navLinks.map((link) =>
                    <Link
                      key={link.name}
                      to={link.to as string}
                      className={cn(
                        "rounded-lg px-3 py-3 text-base font-semibold transition-colors",
                        isDark ? "active:bg-white/10" : "active:bg-muted"
                      )}
                      style={{ color: ink }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  )}
                  <div
                    className={cn(
                      "mt-3 flex flex-col gap-3 border-t pt-4",
                      isDark ? "border-white/10" : "border-border/60"
                    )}
                  >
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                      <button
                        type="button"
                        className={cn(
                          "w-full rounded-lg border-2 px-4 py-3 text-sm font-bold transition-all active:scale-[0.98]",
                          isDark
                            ? "border-white/25 bg-white/5 text-zinc-100"
                            : "border-primary bg-white text-foreground"
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

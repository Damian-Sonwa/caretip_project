import { ArrowRight, Twitter, Linkedin, Github } from "lucide-react";
import { Link } from "react-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

const APP_VERSION =
  typeof import.meta.env.VITE_APP_VERSION === "string" && import.meta.env.VITE_APP_VERSION.trim() !== ""
    ? import.meta.env.VITE_APP_VERSION.trim()
    : null;

export function Footer({
  variant = "default",
  surface = "light",
}: {
  variant?: "default" | "minimal";
  /** Used with `variant="minimal"` for dark auth pages */
  surface?: "light" | "dark";
}) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const footerLinks = useMemo(
    () => ({
      Product: [
        { name: t("footer.linkForBusinesses"), to: "/#business-section" },
        { name: t("footer.linkForEmployees"), to: "/#for-employees" },
        { name: t("footer.linkFeatures"), to: "/features" },
        { name: t("footer.linkHowItWorks"), to: "/how-it-works" },
        { name: t("footer.linkPricing"), to: "/pricing" },
      ],
      Company: [
        { name: t("footer.linkAbout"), to: "/#about-section" },
        { name: t("footer.linkContact"), to: "/contact" },
      ],
      Resources: [
        { name: t("footer.linkHelp"), to: "/help" },
        { name: t("footer.linkFaq"), to: "/faq" },
      ],
    }),
    [t],
  );

  if (variant === "minimal") {
    const dark = surface === "dark";
    return (
      <footer
        className={cn(
          "mt-auto border-t px-4 py-6",
          dark ? "border-white/10 bg-zinc-950/90 text-zinc-400" : "border-border bg-card/30 text-muted-foreground",
        )}
      >
        <div className="mx-auto max-w-7xl text-center text-sm">
          <p>{t("footer.copyright", { year })}</p>
          {APP_VERSION ? (
            <p className="mt-1 text-xs opacity-80">{t("footer.version", { version: APP_VERSION })}</p>
          ) : (
            <p className="mt-1 text-xs opacity-80">{t("footer.platformAdmin")}</p>
          )}
        </div>
      </footer>
    );
  }

  const handleLinkClick = () => {
    window.scrollTo(0, 0);
  };

  return (
    <>
      <footer className="relative overflow-hidden border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-zinc-900 to-neutral-950" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-7xl px-6 py-12 sm:py-16">
          <div className="mb-12 grid grid-cols-1 gap-8 sm:mb-16 sm:gap-12 md:grid-cols-2 lg:grid-cols-10 lg:gap-8">
            <div className="space-y-6 lg:col-span-4">
              <h3 className="text-xl font-bold text-white">{t("footer.brandTitle")}</h3>
              <p className="max-w-sm leading-relaxed text-neutral-300">{t("footer.brandBlurb")}</p>

              <div className="flex items-center gap-4 pt-2">
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-neutral-300 transition-all hover:bg-white/10 hover:text-white"
                  aria-label={t("footer.twitter")}
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-neutral-300 transition-all hover:bg-white/10 hover:text-white"
                  aria-label={t("footer.linkedin")}
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-neutral-300 transition-all hover:bg-white/10 hover:text-white"
                  aria-label={t("footer.github")}
                >
                  <Github className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="space-y-5 lg:col-span-2">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">{t("footer.colProduct")}</h4>
              <ul className="space-y-3">
                {footerLinks.Product.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-block text-sm text-neutral-300 transition-colors hover:text-white"
                      onClick={link.to.startsWith("/#") ? undefined : handleLinkClick}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-5 lg:col-span-2">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">{t("footer.colCompany")}</h4>
              <ul className="space-y-3">
                {footerLinks.Company.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-block text-sm text-neutral-300 transition-colors hover:text-white"
                      onClick={link.to.startsWith("/#") ? undefined : handleLinkClick}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-5 lg:col-span-2">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">{t("footer.colResources")}</h4>
              <ul className="space-y-3">
                {footerLinks.Resources.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-block text-sm text-neutral-300 transition-colors hover:text-white"
                      onClick={handleLinkClick}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex flex-col items-center gap-6 text-sm text-neutral-300 md:flex-row">
                <p>{t("footer.copyright", { year })}</p>
                <div className="flex items-center gap-6">
                  <Link to="/privacy" className="transition-colors hover:text-white" onClick={handleLinkClick}>
                    {t("footer.privacy")}
                  </Link>
                  <Link to="/terms" className="transition-colors hover:text-white" onClick={handleLinkClick}>
                    {t("footer.terms")}
                  </Link>
                  <Link to="/cookies" className="transition-colors hover:text-white" onClick={handleLinkClick}>
                    {t("footer.cookies")}
                  </Link>
                </div>
              </div>
              <LanguageSwitcher variant="inline" className="border-white/15" />
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

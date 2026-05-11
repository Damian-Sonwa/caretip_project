import { Link } from "react-router";
import { ArrowLeft, UserPlus, QrCode, Smartphone, Wallet, Shield, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { AuthLikePageBackground } from "../components/AuthLikePageBackground";

export function HowItWorksPage() {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-[100dvh] bg-white dark:bg-neutral-950">
      <AuthLikePageBackground />
      <div className="relative z-10 min-w-0">
        <Navigation />

        <main className="min-h-[70vh] min-w-0 px-6 pb-20 pt-24 sm:pt-28">
          <div className="mx-auto max-w-4xl">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("staticPages.common.backToHome")}</span>
            </Link>

            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">{t("staticPages.howItWorks.title")}</h1>
                <p className="text-lg text-neutral-600 sm:text-xl">{t("staticPages.howItWorks.subtitle")}</p>
              </div>

              <div className="pt-8">
                <div className="space-y-12">
                  <div className="space-y-8">
                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <UserPlus className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {t("staticPages.howItWorks.stepBadge", { n: 1 })}
                          </span>
                          <h3 className="text-2xl font-semibold text-neutral-900">{t("staticPages.howItWorks.s1Title")}</h3>
                        </div>
                        <p className="mb-4 text-neutral-600">{t("staticPages.howItWorks.s1Body")}</p>
                        <div className="rounded-lg border border-neutral-200 bg-white/95 p-4 shadow-sm">
                          <p className="text-sm text-neutral-600">
                            <strong className="text-neutral-900">{t("staticPages.howItWorks.s1TipLabel")}</strong>{" "}
                            {t("staticPages.howItWorks.s1TipBody")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <QrCode className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {t("staticPages.howItWorks.stepBadge", { n: 2 })}
                          </span>
                          <h3 className="text-2xl font-semibold text-neutral-900">{t("staticPages.howItWorks.s2Title")}</h3>
                        </div>
                        <p className="mb-4 text-neutral-600">{t("staticPages.howItWorks.s2Body")}</p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 text-center shadow-sm">
                            <p className="mb-1 text-xs font-semibold text-neutral-900">{t("staticPages.howItWorks.s2chip1t")}</p>
                            <p className="text-xs text-neutral-600">{t("staticPages.howItWorks.s2chip1s")}</p>
                          </div>
                          <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 text-center shadow-sm">
                            <p className="mb-1 text-xs font-semibold text-neutral-900">{t("staticPages.howItWorks.s2chip2t")}</p>
                            <p className="text-xs text-neutral-600">{t("staticPages.howItWorks.s2chip2s")}</p>
                          </div>
                          <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 text-center shadow-sm">
                            <p className="mb-1 text-xs font-semibold text-neutral-900">{t("staticPages.howItWorks.s2chip3t")}</p>
                            <p className="text-xs text-neutral-600">{t("staticPages.howItWorks.s2chip3s")}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Smartphone className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {t("staticPages.howItWorks.stepBadge", { n: 3 })}
                          </span>
                          <h3 className="text-2xl font-semibold text-neutral-900">{t("staticPages.howItWorks.s3Title")}</h3>
                        </div>
                        <p className="mb-4 text-neutral-600">{t("staticPages.howItWorks.s3Body")}</p>
                        <div className="rounded-lg border border-neutral-200 bg-white/95 p-4 shadow-sm">
                          <p className="text-sm text-neutral-600">
                            <strong className="text-neutral-900">{t("staticPages.howItWorks.s3GuestLabel")}</strong>{" "}
                            {t("staticPages.howItWorks.s3GuestBody")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Wallet className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {t("staticPages.howItWorks.stepBadge", { n: 4 })}
                          </span>
                          <h3 className="text-2xl font-semibold text-neutral-900">{t("staticPages.howItWorks.s4Title")}</h3>
                        </div>
                        <p className="mb-4 text-neutral-600">{t("staticPages.howItWorks.s4Body")}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-sm">
                            <p className="text-lg font-semibold text-primary">{t("staticPages.howItWorks.s4stat1t")}</p>
                            <p className="text-xs text-neutral-600">{t("staticPages.howItWorks.s4stat1s")}</p>
                          </div>
                          <div className="rounded-lg border border-neutral-200 bg-white/95 p-3 shadow-sm">
                            <p className="text-lg font-semibold text-primary">{t("staticPages.howItWorks.s4stat2t")}</p>
                            <p className="text-xs text-neutral-600">{t("staticPages.howItWorks.s4stat2s")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-12">
                    <h2 className="mb-8 text-center text-3xl font-semibold text-neutral-900">{t("staticPages.howItWorks.trustTitle")}</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="rounded-xl border border-neutral-200 bg-white/95 p-6 shadow-sm">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-neutral-900">{t("staticPages.howItWorks.trust1Title")}</h3>
                        <p className="text-sm text-neutral-600">{t("staticPages.howItWorks.trust1Body")}</p>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-white/95 p-6 shadow-sm">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <Zap className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-neutral-900">{t("staticPages.howItWorks.trust2Title")}</h3>
                        <p className="text-sm text-neutral-600">{t("staticPages.howItWorks.trust2Body")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-lg">
                    <h3 className="mb-3 text-2xl font-semibold text-neutral-900">{t("staticPages.howItWorks.ctaTitle")}</h3>
                    <p className="mb-6 text-neutral-600">{t("staticPages.howItWorks.ctaBody")}</p>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                    >
                      {t("staticPages.howItWorks.ctaPricing")}
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

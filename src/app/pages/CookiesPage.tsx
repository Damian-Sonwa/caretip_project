import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import AnimatedShaderBackground from "../components/ui/animated-shader-background";

export function CookiesPage() {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen">
      <AnimatedShaderBackground />
      <div className="relative z-10">
        <Navigation />

        <main className="min-h-[70vh] px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">{t("staticPages.common.backToHome")}</span>
            </Link>

            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">{t("staticPages.cookies.title")}</h1>
                <p className="text-lg text-muted-foreground sm:text-xl">{t("staticPages.cookies.subtitle")}</p>
              </div>

              <div className="pt-8">
                <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
                  <div className="space-y-6 text-muted-foreground">
                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.cookies.whatTitle")}</h2>
                      <p>{t("staticPages.cookies.whatBody")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.cookies.typesTitle")}</h2>

                      <div className="mt-4 space-y-4">
                        <div className="rounded-lg border border-border bg-background p-4">
                          <h3 className="mb-2 text-lg font-semibold text-foreground">{t("staticPages.cookies.essentialTitle")}</h3>
                          <p className="text-sm">{t("staticPages.cookies.essentialBody")}</p>
                          <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm">
                            <li>{t("staticPages.cookies.essentialLi0")}</li>
                            <li>{t("staticPages.cookies.essentialLi1")}</li>
                            <li>{t("staticPages.cookies.essentialLi2")}</li>
                          </ul>
                        </div>

                        <div className="rounded-lg border border-border bg-background p-4">
                          <h3 className="mb-2 text-lg font-semibold text-foreground">{t("staticPages.cookies.performanceTitle")}</h3>
                          <p className="text-sm">{t("staticPages.cookies.performanceBody")}</p>
                          <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm">
                            <li>{t("staticPages.cookies.performanceLi0")}</li>
                            <li>{t("staticPages.cookies.performanceLi1")}</li>
                            <li>{t("staticPages.cookies.performanceLi2")}</li>
                          </ul>
                        </div>

                        <div className="rounded-lg border border-border bg-background p-4">
                          <h3 className="mb-2 text-lg font-semibold text-foreground">{t("staticPages.cookies.functionalTitle")}</h3>
                          <p className="text-sm">{t("staticPages.cookies.functionalBody")}</p>
                          <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm">
                            <li>{t("staticPages.cookies.functionalLi0")}</li>
                            <li>{t("staticPages.cookies.functionalLi1")}</li>
                            <li>{t("staticPages.cookies.functionalLi2")}</li>
                          </ul>
                        </div>

                        <div className="rounded-lg border border-border bg-background p-4">
                          <h3 className="mb-2 text-lg font-semibold text-foreground">{t("staticPages.cookies.targetingTitle")}</h3>
                          <p className="text-sm">{t("staticPages.cookies.targetingBody")}</p>
                          <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm">
                            <li>{t("staticPages.cookies.targetingLi0")}</li>
                            <li>{t("staticPages.cookies.targetingLi1")}</li>
                            <li>{t("staticPages.cookies.targetingLi2")}</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.cookies.thirdTitle")}</h2>
                      <p className="mb-3">{t("staticPages.cookies.thirdLead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.cookies.thirdLi0")}</li>
                        <li>{t("staticPages.cookies.thirdLi1")}</li>
                        <li>{t("staticPages.cookies.thirdLi2")}</li>
                        <li>{t("staticPages.cookies.thirdLi3")}</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.cookies.manageTitle")}</h2>
                      <p className="mb-3">{t("staticPages.cookies.manageLead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.cookies.manageLi0")}</li>
                        <li>{t("staticPages.cookies.manageLi1")}</li>
                        <li>{t("staticPages.cookies.manageLi2")}</li>
                      </ul>
                      <p className="mt-3 text-sm italic">{t("staticPages.cookies.manageNote")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.cookies.browserTitle")}</h2>
                      <div className="space-y-2">
                        <p>{t("staticPages.cookies.browserChrome")}</p>
                        <p>{t("staticPages.cookies.browserFirefox")}</p>
                        <p>{t("staticPages.cookies.browserSafari")}</p>
                        <p>{t("staticPages.cookies.browserEdge")}</p>
                      </div>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.cookies.retentionTitle")}</h2>
                      <p className="mb-3">{t("staticPages.cookies.retentionLead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.cookies.retentionLi0")}</li>
                        <li>{t("staticPages.cookies.retentionLi1")}</li>
                        <li>{t("staticPages.cookies.retentionLi2")}</li>
                        <li>{t("staticPages.cookies.retentionLi3")}</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.cookies.updatesTitle")}</h2>
                      <p>{t("staticPages.cookies.updatesBody")}</p>
                    </div>

                    <div className="border-t border-border pt-6">
                      <p className="text-sm">
                        <strong>{t("staticPages.cookies.footerLastLabel")}</strong> {t("staticPages.cookies.footerLastDate")}
                      </p>
                      <p className="mt-3 text-sm">{t("staticPages.cookies.footerContact")}</p>
                    </div>
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

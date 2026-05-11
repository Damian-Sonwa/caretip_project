import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import AnimatedShaderBackground from "../components/ui/animated-shader-background";

export function TermsPage() {
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
                <h1 className="text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">{t("staticPages.terms.title")}</h1>
                <p className="text-lg text-muted-foreground sm:text-xl">{t("staticPages.terms.subtitle")}</p>
              </div>

              <div className="pt-8">
                <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
                  <div className="space-y-6 text-muted-foreground">
                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s1Title")}</h2>
                      <p>{t("staticPages.terms.s1Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s2Title")}</h2>
                      <p className="mb-3">{t("staticPages.terms.s2Lead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.terms.s2Li0")}</li>
                        <li>{t("staticPages.terms.s2Li1")}</li>
                        <li>{t("staticPages.terms.s2Li2")}</li>
                        <li>{t("staticPages.terms.s2Li3")}</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s3Title")}</h2>
                      <p className="mb-3">{t("staticPages.terms.s3Lead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.terms.s3Li0")}</li>
                        <li>{t("staticPages.terms.s3Li1")}</li>
                        <li>{t("staticPages.terms.s3Li2")}</li>
                        <li>{t("staticPages.terms.s3Li3")}</li>
                      </ul>
                      <p className="mt-3">{t("staticPages.terms.s3Foot")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s4Title")}</h2>
                      <p className="mb-3">{t("staticPages.terms.s4Lead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.terms.s4Li0")}</li>
                        <li>{t("staticPages.terms.s4Li1")}</li>
                        <li>{t("staticPages.terms.s4Li2")}</li>
                        <li>{t("staticPages.terms.s4Li3")}</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s5Title")}</h2>
                      <p className="mb-3">{t("staticPages.terms.s5Lead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.terms.s5Li0")}</li>
                        <li>{t("staticPages.terms.s5Li1")}</li>
                        <li>{t("staticPages.terms.s5Li2")}</li>
                        <li>{t("staticPages.terms.s5Li3")}</li>
                        <li>{t("staticPages.terms.s5Li4")}</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s6Title")}</h2>
                      <p>{t("staticPages.terms.s6Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s7Title")}</h2>
                      <p>{t("staticPages.terms.s7Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s8Title")}</h2>
                      <p>{t("staticPages.terms.s8Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s9Title")}</h2>
                      <p>{t("staticPages.terms.s9Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s10Title")}</h2>
                      <p>{t("staticPages.terms.s10Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.terms.s11Title")}</h2>
                      <p>{t("staticPages.terms.s11Body")}</p>
                    </div>

                    <div className="border-t border-border pt-6">
                      <p className="text-sm">
                        <strong>{t("staticPages.terms.footerLastLabel")}</strong> {t("staticPages.terms.footerLastDate")}
                      </p>
                      <p className="mt-3 text-sm">{t("staticPages.terms.footerContact")}</p>
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

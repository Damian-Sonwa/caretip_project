import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import AnimatedShaderBackground from "../components/ui/animated-shader-background";

export function PrivacyPage() {
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
                <h1 className="text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">{t("staticPages.privacy.title")}</h1>
                <p className="text-lg text-muted-foreground sm:text-xl">{t("staticPages.privacy.lastUpdatedLine")}</p>
                <p className="text-muted-foreground">{t("staticPages.privacy.intro")}</p>
              </div>

              <div className="pt-8">
                <div className="space-y-6 rounded-2xl border border-border bg-card p-8">
                  <div className="space-y-6 text-muted-foreground">
                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.privacy.s1Title")}</h2>
                      <p className="mb-3">{t("staticPages.privacy.s1Lead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.privacy.s1Li0")}</li>
                        <li>{t("staticPages.privacy.s1Li1")}</li>
                        <li>{t("staticPages.privacy.s1Li2")}</li>
                        <li>{t("staticPages.privacy.s1Li3")}</li>
                        <li>{t("staticPages.privacy.s1Li4")}</li>
                      </ul>
                      <p className="mt-3">{t("staticPages.privacy.s1Foot")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.privacy.s2Title")}</h2>
                      <p className="mb-3">{t("staticPages.privacy.s2Lead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.privacy.s2Li0")}</li>
                        <li>{t("staticPages.privacy.s2Li1")}</li>
                        <li>{t("staticPages.privacy.s2Li2")}</li>
                        <li>{t("staticPages.privacy.s2Li3")}</li>
                        <li>{t("staticPages.privacy.s2Li4")}</li>
                        <li>{t("staticPages.privacy.s2Li5")}</li>
                        <li>{t("staticPages.privacy.s2Li6")}</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.privacy.s3Title")}</h2>
                      <p className="mb-3">{t("staticPages.privacy.s3Lead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.privacy.s3Li0")}</li>
                        <li>{t("staticPages.privacy.s3Li1")}</li>
                        <li>{t("staticPages.privacy.s3Li2")}</li>
                        <li>{t("staticPages.privacy.s3Li3")}</li>
                      </ul>
                      <p className="mt-3">{t("staticPages.privacy.s3Foot")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.privacy.s4Title")}</h2>
                      <p>{t("staticPages.privacy.s4Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.privacy.s5Title")}</h2>
                      <p className="mb-3">{t("staticPages.privacy.s5Lead")}</p>
                      <ul className="ml-4 list-inside list-disc space-y-2">
                        <li>{t("staticPages.privacy.s5Li0")}</li>
                        <li>{t("staticPages.privacy.s5Li1")}</li>
                        <li>{t("staticPages.privacy.s5Li2")}</li>
                        <li>{t("staticPages.privacy.s5Li3")}</li>
                        <li>{t("staticPages.privacy.s5Li4")}</li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.privacy.s6Title")}</h2>
                      <p>{t("staticPages.privacy.s6Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.privacy.s7Title")}</h2>
                      <p>{t("staticPages.privacy.s7Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.privacy.s8Title")}</h2>
                      <p>{t("staticPages.privacy.s8Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.privacy.s9Title")}</h2>
                      <p>{t("staticPages.privacy.s9Body")}</p>
                    </div>

                    <div>
                      <h2 className="mb-3 text-2xl font-semibold text-foreground">{t("staticPages.privacy.s10Title")}</h2>
                      <p>{t("staticPages.privacy.s10Body")}</p>
                    </div>

                    <div className="border-t border-border pt-6">
                      <p className="text-sm">
                        <strong>{t("staticPages.privacy.footerLastLabel")}</strong> {t("staticPages.privacy.footerLastDate")}
                      </p>
                      <p className="mt-3 text-sm">{t("staticPages.privacy.footerContact")}</p>
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

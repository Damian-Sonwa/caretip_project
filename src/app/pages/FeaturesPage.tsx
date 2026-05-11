import { useMemo } from "react";
import { motion } from "motion/react";
import { QrCode, ShieldCheck, Zap, BarChart3, Users, Building2, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { AuthLikePageBackground } from "../components/AuthLikePageBackground";
import { LandingBorderedCard } from "@/components/ui/landing-bordered-card";

const FEATURE_ICONS: LucideIcon[] = [QrCode, Users, BarChart3, ShieldCheck, Zap, Building2];
const FEATURE_NUMS = ["1", "2", "3", "4", "5", "6"] as const;

export function FeaturesPage() {
  const { t } = useTranslation();
  const features = useMemo(
    () =>
      FEATURE_NUMS.map((n, idx) => ({
        Icon: FEATURE_ICONS[idx],
        title: t(`staticPages.features.f${n}Title`),
        description: t(`staticPages.features.f${n}Desc`),
      })),
    [t],
  );

  return (
    <div className="relative min-h-[100dvh] bg-white">
      <AuthLikePageBackground />
      <div className="relative z-10 min-w-0">
        <Navigation />

        <main className="min-w-0 px-6 pb-20 pt-24 sm:pt-28">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ y: 14, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="mb-10 space-y-4 text-center"
            >
              <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">{t("staticPages.features.title")}</h1>
              <p className="mx-auto max-w-2xl text-lg text-neutral-600 sm:text-xl">{t("staticPages.features.subtitle")}</p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {features.map((f, idx) => (
                <motion.div
                  key={f.title}
                  initial={{ y: 14, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.06 }}
                >
                  <LandingBorderedCard cardClassName="p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[hsl(33_82%_55%_/_0.12)]">
                        <f.Icon className="h-6 w-6 text-[hsl(33_82%_55%)]" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-foreground">{f.title}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                      </div>
                    </div>
                  </LandingBorderedCard>
                </motion.div>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

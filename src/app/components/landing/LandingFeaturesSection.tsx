import { useMemo } from "react";
import { motion } from "motion/react";
import { QrCode, LayoutDashboard, BarChart3, History, Wallet, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";

export function LandingFeaturesSection() {
  const { t } = useTranslation();

  const items = useMemo(
    () =>
      [
        { icon: QrCode, title: t("landing.features.i1Title"), text: t("landing.features.i1Text") },
        { icon: LayoutDashboard, title: t("landing.features.i2Title"), text: t("landing.features.i2Text") },
        { icon: BarChart3, title: t("landing.features.i3Title"), text: t("landing.features.i3Text") },
        { icon: History, title: t("landing.features.i4Title"), text: t("landing.features.i4Text") },
        { icon: Wallet, title: t("landing.features.i5Title"), text: t("landing.features.i5Text") },
        { icon: Star, title: t("landing.features.i6Title"), text: t("landing.features.i6Text") },
      ],
    [t],
  );

  return (
    <section
      id="features"
      className="scroll-mt-[80px] w-full min-w-0 bg-gray-50 px-4 py-12 sm:px-6 sm:py-20 lg:py-24 dark:bg-neutral-900"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-balance text-[clamp(1.5rem,5.2vw,2.25rem)] font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl"
          >
            {t("landing.features.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-pretty text-lg text-neutral-600 dark:text-neutral-400"
          >
            {t("landing.features.subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                className="h-full"
              >
                <Card className="relative h-full overflow-hidden border-2 border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
                  {idx === 0 ? (
                    <BorderBeam size={220} duration={18} colorFrom="#e9932f" colorTo="#000000" />
                  ) : null}
                  <CardHeader className="relative z-[1] flex flex-col gap-3 pb-4 pt-1 sm:gap-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-lg border border-border bg-muted p-2">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                    </div>
                    <CardTitle className="text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
                      {item.title}
                    </CardTitle>
                    <p className="text-[15px] font-medium leading-[1.55] text-muted-foreground sm:text-sm sm:font-normal sm:leading-relaxed">
                      {item.text}
                    </p>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

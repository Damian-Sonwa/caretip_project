import { motion } from "motion/react";
import { QrCode, LayoutDashboard, BarChart3, History, Wallet, Star } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { BorderBeam } from "@/components/ui/border-beam";

const items = [
  { icon: QrCode, title: "QR tipping pages", text: "Branded pages guests open in one scan." },
  { icon: LayoutDashboard, title: "Employee dashboards", text: "Earnings and momentum in one place." },
  { icon: BarChart3, title: "Business analytics", text: "See what is working across shifts and venues." },
  { icon: History, title: "Tip history", text: "A clear record for staff and finance." },
  { icon: Wallet, title: "Payout system", text: "Route and release tips with confidence." },
  { icon: Star, title: "Feedback & ratings", text: "Capture praise while the moment is fresh." },
] as const;

export function LandingFeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-[80px] bg-gray-50 px-6 py-16 sm:py-20 lg:py-24 dark:bg-neutral-900"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl"
          >
            Everything you need to grow
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-pretty text-lg text-neutral-600 dark:text-neutral-400"
          >
            One platform for tipping, visibility, and payouts, without the overhead.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6">
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
                  <CardHeader className="relative z-[1] pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-lg border border-border bg-muted p-2">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                    </div>
                    <CardTitle className="text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
                      {item.title}
                    </CardTitle>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
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

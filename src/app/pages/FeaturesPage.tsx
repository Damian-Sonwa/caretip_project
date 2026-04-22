import { motion } from "motion/react";
import { QrCode, ShieldCheck, Zap, BarChart3, Users, Building2 } from "lucide-react";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { AuthLikePageBackground } from "../components/AuthLikePageBackground";
import { LandingBorderedCard } from "@/components/ui/landing-bordered-card";

const FEATURES = [
  {
    Icon: QrCode,
    title: "QR Code Tipping",
    description: "Guests scan and tip in seconds—no app installs, no friction.",
  },
  {
    Icon: Users,
    title: "Employee Performance Tracking",
    description: "Track tips, ratings, and goals in one place so staff stay motivated.",
  },
  {
    Icon: BarChart3,
    title: "Business Dashboard Insights",
    description: "See team performance, trends, and activity across shifts and venues.",
  },
  {
    Icon: ShieldCheck,
    title: "Secure Payments (Stripe)",
    description: "Trusted checkout and modern security so payments stay reliable and safe.",
  },
  {
    Icon: Zap,
    title: "Real-time Updates",
    description: "Live activity and notifications so you can coach and respond fast.",
  },
  {
    Icon: Building2,
    title: "Multi-location Support",
    description: "Manage multiple venues, locations, and tables without losing clarity.",
  },
] as const;

export function FeaturesPage() {
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
              <h1 className="text-4xl font-bold text-neutral-900 sm:text-5xl md:text-6xl">
                Everything CareTip Can Do
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-neutral-600 sm:text-xl">
                A clear view of the platform—built for hospitality teams and designed for fast tipping.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {FEATURES.map((f, idx) => (
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


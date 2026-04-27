import { motion } from "motion/react";
import { Scan, Zap, CheckCircle } from "lucide-react";
import { LandingBorderedCard } from "@/components/ui/landing-bordered-card";
import { LandingImageFrame } from "@/components/ui/landing-image-frame";
import newly01Img from "../../../../images/newly01.png";

/** Unsplash: people at a table paying with phone / card (original left-panel image) */
const IMG_PEOPLE_PAYMENT = newly01Img;

function InstantTipSplitIllustration() {
  return (
    <LandingImageFrame
      className="relative aspect-square min-h-[180px] w-full bg-white sm:min-h-[220px]"
      role="img"
      aria-label="People at a table completing a mobile payment"
    >
      <img
        src={IMG_PEOPLE_PAYMENT}
        alt="Guests at a table paying with a phone"
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0">
        <span className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-[0_6px_18px_rgba(235,153,44,0.22)]">
          Pay
        </span>
      </div>
      <div className="absolute right-2 top-2 max-w-[min(100%,11rem)] rounded-xl border border-primary/15 bg-white p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:right-3 sm:top-3 sm:max-w-[13rem] sm:p-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent animate-pulse" aria-hidden />
          <p className="text-xs font-semibold leading-tight text-foreground sm:text-sm">New tip received</p>
        </div>
      </div>
    </LandingImageFrame>
  );
}

export function QRTippingSection() {
  const features = [
    {
      icon: Scan,
      title: "Scan & pay in seconds",
      description: "Camera scan. No guest app."
    },
    {
      icon: Zap,
      title: "Fast checkout",
      description: "Pick an amount and confirm. Done."
    },
    {
      icon: CheckCircle,
      title: "Secure payments",
      description: "Card processing you can trust."
    }
  ];

  return (
    <section className="bg-white px-6 py-24">
      <div className="max-w-7xl mx-auto min-w-0">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-w-0">
          {/* Left: Content */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-8 min-w-0"
          >
            <div className="space-y-4">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                QR tipping
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black">
                One scan.
                <br />
                <span className="text-primary">Instant tip.</span>
              </h2>
              <p className="text-lg leading-relaxed text-black/70">
                Guests tip from their phone. No cash. No extra apps.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-black mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-black/70">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="pt-4">
              <button className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-[0_8px_22px_rgba(235,153,44,0.28)] transition-colors hover:bg-[#D8841F]">
                Generate Your QR Code
              </button>
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative min-w-0 w-full max-w-full"
            whileHover={{ y: -5 }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              {/* Split-card visual (guest Pay ↔ staff live notification) */}
              <LandingBorderedCard
                cardClassName="min-w-0 max-w-full p-6"
              >
                <InstantTipSplitIllustration />
                <div className="mt-4 sm:mt-6 text-center px-0.5">
                  <p className="mb-1 text-sm font-semibold text-primary">Scan to tip</p>
                  <p className="text-lg sm:text-xl font-medium text-black/70 break-words">
                    Schmidt Paul
                  </p>
                  <p className="text-sm text-black/50">Server • Table 12</p>
                </div>
              </LandingBorderedCard>

              {/* Decorative Elements: hidden on narrow screens to avoid horizontal overflow */}
              <div className="absolute -top-6 -right-6 hidden w-24 rounded-full bg-primary/[0.08] blur-2xl opacity-90 sm:block" aria-hidden />
              <div className="absolute -bottom-6 -left-6 hidden w-32 rounded-full bg-primary/[0.06] blur-2xl opacity-90 sm:block" aria-hidden />
            </div>

            {/* Floating Badge: inline on mobile so it does not overflow the viewport */}
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              whileInView={{ y: 0, opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative mt-4 sm:absolute sm:mt-0 sm:-bottom-6 sm:-left-6 sm:max-w-[calc(100vw-2rem)] bg-white rounded-3xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-black/[0.06]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-black/60">Avg. scan time</p>
                  <p className="text-lg font-bold text-black">3 seconds</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

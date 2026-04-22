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
      className="relative w-full bg-[#FAFAFA] aspect-square min-h-[180px] sm:min-h-[220px]"
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/5" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0">
        <span className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-lg">
          Pay
        </span>
      </div>
      <div className="absolute right-2 top-2 max-w-[min(100%,11rem)] rounded-xl border border-border bg-background/95 p-2.5 shadow-lg backdrop-blur-sm sm:right-3 sm:top-3 sm:max-w-[13rem] sm:p-3">
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
    <section className="bg-transparent px-4 py-16 sm:px-6 sm:py-28">
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
              <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold">
                QR tipping
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
                One scan.
                <br />
                <span className="text-accent">Instant tip.</span>
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
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
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="pt-4">
              <button className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-lg text-lg">
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
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              {/* Split-card visual (guest Pay ↔ staff live notification) */}
              <LandingBorderedCard
                cardClassName="min-w-0 max-w-full rounded-xl border-0 p-3 shadow-none"
              >
                <InstantTipSplitIllustration />
                <div className="mt-4 sm:mt-6 text-center px-0.5">
                  <p className="mb-1 text-sm font-semibold text-primary">Scan to tip</p>
                  <p className="text-lg sm:text-xl font-medium text-muted-foreground/85 break-words">
                    Schmidt Paul
                  </p>
                  <p className="text-sm text-muted-foreground/65">Server • Table 12</p>
                </div>
              </LandingBorderedCard>

              {/* Decorative Elements: hidden on narrow screens to avoid horizontal overflow */}
              <div className="absolute -top-6 -right-6 hidden w-24 bg-accent rounded-full blur-2xl opacity-50 sm:block" aria-hidden />
              <div className="absolute -bottom-6 -left-6 hidden w-32 bg-primary rounded-full blur-2xl opacity-30 sm:block" aria-hidden />
            </div>

            {/* Floating Badge: inline on mobile so it does not overflow the viewport */}
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              whileInView={{ y: 0, opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative mt-4 sm:absolute sm:mt-0 sm:-bottom-6 sm:-left-6 sm:max-w-[calc(100vw-2rem)] bg-white rounded-xl p-4 shadow-xl border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. scan time</p>
                  <p className="text-lg font-bold text-foreground">3 seconds</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

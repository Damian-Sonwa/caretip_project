import { motion } from "motion/react";
import {
  Download,
  Zap,
  Globe,
  TrendingUp,
  Shield,
  Users,
  Euro,
} from "lucide-react";
import { formatEur } from "../lib/formatEur";

export function HeroSection() {
  const features = [
    { icon: Zap, label: "Instant Tips" },
    { icon: Globe, label: "Anywhere" },
    { icon: Euro, label: "Fast Withdrawals" },
    { icon: Shield, label: "Secure" },
    { icon: Users, label: "Easy Sharing" },
    { icon: TrendingUp, label: "Track Earnings" },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-neutral-950 z-0"></div>

      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/30 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-8 order-2 lg:order-1"
          >
            {/* Feature Icons Row */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex gap-2 sm:gap-3 flex-wrap"
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.label}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.4 + index * 0.1,
                    }}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    <span className="text-[10px] sm:text-xs text-white font-medium">
                      {feature.label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Main Heading */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
                Receive tips effortlessly,
                <br />
                anytime
              </h1>
              <p className="text-base sm:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-xl">
                Share your link or QR code and get paid directly by customers. Withdraw to your bank account instantly.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                type="button"
                className="group flex touch-manipulation items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition-[colors,opacity,box-shadow] hover:bg-white/90 hover:shadow-2xl active:opacity-90 sm:px-8 sm:py-4 sm:text-base"
              >
                Get Started
              </button>
              <button
                type="button"
                className="flex touch-manipulation items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-[colors,opacity,box-shadow] hover:bg-white/20 active:opacity-90 sm:px-8 sm:py-4 sm:text-base"
              >
                <Download className="w-4 h-4 sm:h-5 sm:w-5" />
                Create Your Tipping Page
              </button>
            </div>

            {/* Trust Badge */}
            <p className="text-xs sm:text-sm text-white/70 text-center sm:text-left">
              No setup fees • Start in minutes • Withdraw anytime
            </p>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="relative lg:h-[600px] flex items-end justify-end order-1 lg:order-2"
          >
            {/* Decorative circle behind image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/30 rounded-full blur-2xl"></div>

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              src="https://images.stockcake.com/public/2/3/d/23d6765e-8480-471c-8909-b70c626b2dcb/future-tech-interface-stockcake.jpg"
              alt="Hospitality professional using digital tipping"
              loading="eager"
              width="580"
              height="387"
              className="relative z-10 w-full max-w-[580px] h-auto object-contain drop-shadow-2xl"
            />

            {/* Floating Stats Card */}
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute bottom-12 left-0 lg:left-auto lg:right-16 bg-white/95 backdrop-blur-sm p-5 rounded-2xl shadow-2xl border border-white/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <Euro className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    Tips This Month
                  </p>
                  <p className="text-2xl font-bold text-foreground">{formatEur(1247, { minFrac: 0, maxFrac: 0 })}</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Notification Badge */}
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="absolute top-12 left-8 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-full shadow-xl border border-white/20 flex items-center gap-2"
            >
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              <p className="text-xs font-semibold text-foreground">
                3,200+ employees receiving tips
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave Transition */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10"></div>
    </section>
  );
}
import { motion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";

export function HeroSectionNew() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Gradient Background - green color */}
      <div className="absolute inset-0 bg-primary z-0"></div>

      {/* Decorative gradient orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/30 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-8 order-2 lg:order-1 text-center md:text-left"
          >
            {/* Trust Badge */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              <span className="text-xs sm:text-sm text-white/90 font-medium">
                Trusted by 5,000+ restaurants and cafes worldwide
              </span>
            </motion.div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 text-white rounded-2xl font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Watch Demo
              </motion.button>
            </div>

            {/* Trust Badge */}
            <p className="text-xs sm:text-sm text-white/70 text-center md:text-left">
              No setup fees • Instant payouts • 24/7 support
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
              alt="Digital tipping platform"
              loading="eager"
              width="580"
              height="387"
              className="relative z-10 w-full max-w-[580px] h-auto object-contain drop-shadow-2xl"
            />

            {/* Main Heading and CTA - Text overlay without card background */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute bottom-12 left-0 lg:left-auto lg:right-16 max-w-md space-y-4 z-20"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                Digital tipping
                <br />
                <span className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">made simple</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-white leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Empower your team to receive tips digitally. Increase earnings, 
                delight guests, and modernize your hospitality business.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-6 sm:px-8 py-3 sm:py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 transition-all hover:shadow-[0_8px_22px_rgba(235,153,44,0.28)] flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave Transition */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10"></div>
    </section>
  );
}
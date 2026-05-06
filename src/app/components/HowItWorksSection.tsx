import { motion } from "motion/react";
import { Link2, Euro, Wallet, QrCode } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      icon: Link2,
      step: "1",
      title: "Share your link / QR",
      description: "Get your unique tipping link and QR code. Share it anywhere: social media, email signature, or print it on business cards.",
      color: "from-accent to-primary"
    },
    {
      icon: Euro,
      step: "2",
      title: "Customer sends tip",
      description: "Customers scan your QR code or click your link to send tips securely and instantly. No app download required for them.",
      color: "from-primary to-accent"
    },
    {
      icon: Wallet,
      step: "3",
      title: "Withdraw to bank",
      description: "Cash out your tips anytime with fast, secure transfers directly to your bank account. Your money, when you need it.",
      color: "from-accent to-primary"
    }
  ];

  return (
    <section className="py-16 sm:py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Start receiving tips in three simple steps. No complicated setup required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                {/* Connecting Line (hidden on mobile, shown on md+) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-accent/30 to-transparent"></div>
                )}

                <div className="relative z-10 text-center space-y-4">
                  {/* Icon Circle */}
                  <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 border-2 border-accent/20 flex items-center justify-center relative">
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.color} opacity-20 blur-xl`}></div>
                    <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-accent relative z-10" />
                    
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center border-4 border-background">
                      {step.step}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-12 sm:mt-16"
        >
          <button className="group px-6 sm:px-8 py-3 sm:py-4 bg-accent text-white rounded-2xl font-semibold hover:bg-accent/90 transition-all hover:shadow-xl hover:shadow-accent/30 inline-flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Get Your Tipping Link
          </button>
          <p className="text-sm text-muted-foreground mt-4">
            Free to start • No credit card required
          </p>
        </motion.div>
      </div>
    </section>
  );
}

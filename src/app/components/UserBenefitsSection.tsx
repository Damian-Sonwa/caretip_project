import { motion } from 'motion/react';
import { 
  Smartphone, 
  Bell, 
  Shield, 
  Zap, 
  Check,
  ArrowRight 
} from 'lucide-react';

export function UserBenefitsSection() {
  const benefits = [
    {
      icon: Smartphone,
      title: 'Access anywhere',
      description: 'Manage your tips on any device—desktop, tablet, or mobile. Your earnings stay synced across all platforms.',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Bell,
      title: 'Instant notifications',
      description: 'Get notified immediately when you receive a tip. Stay updated on your earnings in real-time.',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Shield,
      title: 'Bank-level security',
      description: 'Your earnings and payment information are encrypted and protected with industry-leading security standards.',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100',
    },
    {
      icon: Zap,
      title: 'Fast withdrawals',
      description: 'Transfer your tips to your bank account instantly. No waiting periods, no hassle—just your money when you need it.',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-100',
    },
  ];

  const stats = [
    { number: '3,200+', label: 'Active Users', sublabel: 'Receiving tips daily' },
    { number: '$847', label: 'Avg Monthly', sublabel: 'Per user in tips' },
    { number: '98.4%', label: 'Satisfaction', sublabel: 'User happiness rate' },
  ];

  return (
    <section className="py-16 sm:py-24 px-6 bg-gradient-to-b from-card/20 via-transparent to-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
            Everything you need, at your fingertips
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Take control with powerful features designed to make your life easier.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16 sm:mb-20">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ y: 30, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative p-6 sm:p-8 rounded-2xl bg-card border border-border hover:border-accent/50 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl ${benefit.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-accent" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="grid md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 text-center group hover:shadow-xl transition-all"
              >
                <div className="space-y-2">
                  <p className="text-4xl sm:text-5xl font-bold text-foreground">
                    {stat.number}
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-foreground">
                    {stat.label}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stat.sublabel}
                  </p>
                </div>

                {/* Checkmark decoration */}
                <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-accent" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
import { motion } from 'motion/react';

export function SocialProof() {
  const stats = [
    { value: '3,200+', label: 'Active Users' },
    { value: '$2.4M+', label: 'Tips Distributed' },
    { value: '150+', label: 'Countries' },
    { value: '4.9/5', label: 'User Rating' },
  ];

  return (
    <section className="py-16 px-6 border-y border-border/50 bg-card/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-10"
        >
          <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-wide">
            TRUSTED BY THOUSANDS OF EMPLOYEES WORLDWIDE
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-4 sm:p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-border hover:border-accent/30 transition-all"
              >
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { GlowingEffect } from './ui/glowing-effect';

export function StatsSection() {
  const data = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 61 },
    { month: 'Apr', value: 58 },
    { month: 'May', value: 72 },
    { month: 'Jun', value: 85 },
  ];

  const stats = [
    { label: "Tips delivered", value: "12,483", change: "+12.5%" },
    { label: "To staff this month", value: "$248K", change: "+23.1%" },
    { label: "Guest satisfaction", value: "94.2%", change: "+2.4%" },
  ];

  return (
    <section className="py-16 sm:py-24 px-6 bg-gradient-to-b from-card/20 via-transparent to-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 items-center">
          {/* Left - Chart */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                See tip volume clearly
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Track tips by week or month so you know what landed with your team — no subscription renewals to chase.
              </p>
            </div>

            <div className="p-4 sm:p-8 rounded-2xl bg-card border border-border shadow-lg">
              <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Tip volume</p>
                <p className="text-xl sm:text-2xl font-semibold text-foreground">+32% this quarter</p>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6E7271', fontSize: 12 }}
                  />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${entry.month}-${index}`} 
                        fill={index === data.length - 1 ? '#14BDEB' : '#ACAD94'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right - Stats */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4 sm:space-y-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative rounded-2xl border border-border p-2"
              >
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
                <div className="relative p-4 sm:p-6 rounded-xl bg-card shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">{stat.label}</p>
                      <p className="text-2xl sm:text-3xl font-semibold text-foreground">{stat.value}</p>
                    </div>
                    <div className="px-2.5 sm:px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                      <p className="text-xs sm:text-sm font-medium text-accent">{stat.change}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Payment Success Rate</p>
                  <p className="text-xl sm:text-2xl font-semibold text-foreground">99.8%</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
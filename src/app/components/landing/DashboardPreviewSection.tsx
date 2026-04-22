import { motion } from "motion/react";
import { Link } from "react-router";
import { BarChart3, Users, Euro, TrendingUp, Eye } from "lucide-react";
import { LandingBorderedCard } from "@/components/ui/landing-bordered-card";
import {
  AnimatedCard,
  CardBody,
  CardDescription,
  CardTitle,
  CardVisual,
  Visual3,
} from "@/components/ui/animated-card-chart";

export function DashboardPreviewSection() {
  return (
    <section
      id="for-employees"
      className="scroll-mt-[80px] bg-transparent px-6 py-20 sm:py-28"
    >
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Business Dashboard Preview */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold">
                For Businesses
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                Complete visibility
                <br />
                <span className="text-accent">into your team</span>
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                One dashboard for tips, staff, and locations.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <BarChart3 className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Live analytics</h3>
                  <p className="text-sm text-muted-foreground">Tip trends and peak hours at a glance.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Team management</h3>
                  <p className="text-sm text-muted-foreground">Staff, QR codes, and venues in one flow.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Euro className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Payout reports</h3>
                  <p className="text-sm text-muted-foreground">Exports for accounting and payroll.</p>
                </div>
              </div>
            </div>

            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 font-semibold text-accent-foreground shadow-lg transition-all hover:bg-accent/90"
            >
              <Eye className="w-5 h-5" />
              View Business Dashboard
            </Link>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <LandingBorderedCard cardClassName="p-6 shadow-2xl">
              {/* Dashboard Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Business Overview</h3>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
                <div className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold">
                  Live
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Euro className="w-4 h-4 text-accent" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">€14,520</p>
                  <p className="text-xs text-muted-foreground">Total Tips</p>
                </div>
                <div className="bg-background rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">12</p>
                  <p className="text-xs text-muted-foreground">Active Staff</p>
                </div>
              </div>

              {/* Tips trend (animated card chart) */}
              <div className="rounded-xl bg-background p-4">
                <AnimatedCard className="mx-auto w-full max-w-none">
                  <CardVisual className="h-[230px] w-full">
                    <Visual3 mainColor="#EB992C" secondaryColor="#F97316" gridColor="#00000010" />
                  </CardVisual>
                  <CardBody className="absolute inset-x-0 bottom-0 border-t-0 bg-[#FAFAFA]/85 backdrop-blur-md">
                    <CardTitle id="card-title">Tips trend</CardTitle>
                    <CardDescription id="card-description">Live activity preview (this week)</CardDescription>
                  </CardBody>
                </AnimatedCard>
              </div>
            </LandingBorderedCard>
          </motion.div>
        </div>

        {/* Employee Dashboard Preview */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative overflow-hidden rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <LandingBorderedCard
                cardClassName="space-y-6 rounded-xl border-0 p-3 shadow-none sm:p-4"
              >
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary"></div>
                  <div>
                    <h3 className="text-lg font-medium text-muted-foreground/85">Schmidt Paul</h3>
                    <p className="text-sm text-muted-foreground/65">Server • Love Garden Swizzy</p>
                  </div>
                </div>

                {/* Today's Earnings */}
                <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Preview</p>
                  <p className="text-sm text-muted-foreground mb-2">Today's Earnings</p>
                  <p className="text-4xl font-bold text-foreground mb-1">€0.00</p>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <span>No activity yet</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-foreground">0</p>
                    <p className="text-xs text-muted-foreground">Tips</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-foreground">N/A</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-foreground">N/A</p>
                    <p className="text-xs text-muted-foreground">Rank</p>
                  </div>
                </div>
              </LandingBorderedCard>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-1 space-y-6 lg:order-2"
          >
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                For Employees
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                Track your success
                <br />
                <span className="text-primary">every day</span>
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Earnings, ratings, and goals in one view.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Euro className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Live earnings</h3>
                  <p className="text-sm text-muted-foreground">Tips as they land: daily, weekly, or monthly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Performance insights</h3>
                  <p className="text-sm text-muted-foreground">See what drives higher tips.</p>
                </div>
              </div>
            </div>

            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-lg"
            >
              <Eye className="w-5 h-5" />
              View Employee Dashboard
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

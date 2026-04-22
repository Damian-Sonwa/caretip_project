import { motion } from "motion/react";
import { Star, MessageSquare, ThumbsUp, TrendingUp } from "lucide-react";
import { LandingBorderedCard } from "@/components/ui/landing-bordered-card";

export function FeedbackSection() {
  return (
    <section className="bg-gray-50 px-6 py-24 sm:py-32">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <span className="inline-block px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-semibold">
                Guest feedback
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
                Turn feedback into
                <br />
                <span className="text-accent">better service</span>
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Ratings after tipping so you can coach and reward fast.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Five-star ratings
                  </h3>
                  <p className="text-muted-foreground">
                    Quick scores across every shift.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Comments
                  </h3>
                  <p className="text-muted-foreground">
                    Short notes that show what worked.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Actionable insights
                  </h3>
                  <p className="text-muted-foreground">
                    Spot trends. Reward wins. Coach gaps.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            {/* Feedback Cards Stack */}
            <div className="relative space-y-4">
              {/* Card 1 */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LandingBorderedCard beamDelay={0} cardClassName="p-6 shadow-lg">
                  <div className="mb-3 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="mb-3 text-base leading-relaxed text-foreground">
                    &ldquo;Mercy picked the perfect wine. Our anniversary dinner was unforgettable.&rdquo;
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-primary" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground/85">Juliet M.</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm font-medium">12</span>
                    </div>
                  </div>
                </LandingBorderedCard>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <LandingBorderedCard beamDelay={2} cardClassName="p-6 shadow-lg">
                  <div className="mb-3 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= 4 ? "fill-accent text-accent" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mb-3 text-base leading-relaxed text-foreground">
                    &ldquo;Attentive service. Marcus knew the menu cold.&rdquo;
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground/85">Maria S.</p>
                        <p className="text-xs text-muted-foreground">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-accent">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm font-medium">8</span>
                    </div>
                  </div>
                </LandingBorderedCard>
              </motion.div>

              {/* Stats Badge */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-xl bg-gradient-to-br from-accent to-primary p-6 text-primary-foreground shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-sm text-primary-foreground/90">Average Rating</p>
                    <p className="text-4xl font-bold">N/A</p>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/15">
                    <Star className="h-8 w-8 fill-primary-foreground text-primary-foreground" />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-primary-foreground/90">Reviews</p>
                    <p className="font-semibold">0</p>
                  </div>
                  <div className="h-8 w-px bg-primary-foreground/25" />
                  <div>
                    <p className="text-primary-foreground/90">This Month</p>
                    <p className="font-semibold">N/A</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -z-10 top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

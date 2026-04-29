import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { TestimonialGrid } from './ui/testimonials-grid';

export function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      quote: 'This app changed how I receive tips! I used to miss out on cash tips, but now customers can tip me digitally. Easy and convenient!',
      name: 'Sarah Johnson',
      role: 'Server',
      imageSrc: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 2,
      quote: 'Love the QR code feature! I put it on my name tag and customers can tip me instantly. Withdrawal is super fast too.',
      name: 'Marcus Chen',
      role: 'Barista',
      imageSrc: 'https://images.unsplash.com/photo-1507003211169-0a6dd7228f2d?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 3,
      quote: 'The best tipping platform! I share my link on social media and my regulars tip me even when I\'m not working. Game changer!',
      name: 'Emily Rodriguez',
      role: 'Hair Stylist',
      imageSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop',
    },
  ];

  return (
    <section id="about" className="py-16 sm:py-24 px-6 bg-gradient-to-b from-transparent via-card/10 to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
            Loved by users everywhere
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of employees receiving tips effortlessly and getting paid faster.
          </p>
        </motion.div>

        {/* Video Testimonial Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16 sm:mb-20"
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-2xl group">
              {/* Video Container */}
              <div className="relative aspect-video bg-gray-50 dark:bg-neutral-900">
                {/* Placeholder - Replace with your video */}
                <video
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                  poster="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&auto=format&fit=crop"
                >
                  <source
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>

                {/* Play Button Overlay (shows before video starts) */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="white" />
                  </div>
                </div>
              </div>

              {/* Video Caption */}
              <div className="p-4 sm:p-6 bg-card">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1780&auto=format&fit=crop"
                      alt="Customer"
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-accent"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base text-foreground font-medium mb-1">
                      "Our guests actually tip more now. QR codes made it effortless. No subscriptions, just simple one-time thanks."
                    </p>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <span className="font-semibold">Jessica Martinez</span>
                      <span>•</span>
                      <span>Small Business Owner</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Testimonials Grid */}
        <TestimonialGrid testimonials={testimonials} />

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 mt-12 sm:mt-16 max-w-4xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center p-4 sm:p-6 rounded-xl bg-card/50 border border-border"
          >
            <p className="text-2xl sm:text-3xl font-bold text-accent">2,500+</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Happy Customers</p>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center p-4 sm:p-6 rounded-xl bg-card/50 border border-border"
          >
            <p className="text-2xl sm:text-3xl font-bold text-accent">4.9/5</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Average Rating</p>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center p-4 sm:p-6 rounded-xl bg-card/50 border border-border"
          >
            <p className="text-2xl sm:text-3xl font-bold text-accent">98%</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Satisfaction Rate</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
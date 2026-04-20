import { motion } from "motion/react";
import { Quote } from "lucide-react";

// TypeScript interface for a single testimonial object
interface Testimonial {
  id: number;
  quote: string;
  name: string;
  role: string;
  imageSrc: string;
}

// TypeScript interface for the component's props
interface TestimonialGridProps {
  testimonials: Testimonial[];
}

/**
 * A responsive grid component to display customer testimonials.
 * Features animated testimonial cards with images and quotes.
 */
export const TestimonialGrid = ({ testimonials }: TestimonialGridProps) => {
  // Animation variants for the container to orchestrate staggered children animations
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  // Animation variants for each testimonial card
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <motion.div
      className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {testimonials.map((testimonial) => (
        <motion.div
          key={testimonial.id}
          className="relative overflow-hidden rounded-lg bg-card shadow-lg border border-border hover:shadow-xl transition-shadow"
          variants={itemVariants}
        >
          <div className="relative">
            <img
              src={testimonial.imageSrc}
              alt={testimonial.name}
              className="h-80 w-full object-cover"
              loading="lazy"
              width="400"
              height="320"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          </div>

          {/* Content within the card */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-left text-white">
            <Quote
              className="mb-4 h-8 w-8 text-white/40"
              aria-hidden="true"
            />
            <blockquote className="text-base font-medium leading-relaxed">
              {testimonial.quote}
            </blockquote>
            <figcaption className="mt-4">
              <p className="font-semibold text-white">
                &mdash; {testimonial.name},
                <span className="ml-1 text-white/60">
                  {testimonial.role}
                </span>
              </p>
            </figcaption>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
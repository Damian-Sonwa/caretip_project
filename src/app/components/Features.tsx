import { motion } from "motion/react";
import { CardStack, CardStackItem } from "./ui/card-stack";
import { useEffect, useState } from "react";

export function Features() {
  const [cardSize, setCardSize] = useState({ width: 580, height: 360 });

  useEffect(() => {
    const updateCardSize = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        // Mobile: smaller cards
        setCardSize({ width: 300, height: 400 });
      } else if (width < 1024) {
        // Tablet: medium cards
        setCardSize({ width: 420, height: 380 });
      } else {
        // Desktop: full size
        setCardSize({ width: 580, height: 360 });
      }
    };

    updateCardSize();
    window.addEventListener('resize', updateCardSize);
    return () => window.removeEventListener('resize', updateCardSize);
  }, []);

  const features: CardStackItem[] = [
    {
      id: "personal-link",
      title: "Personal Tipping Link",
      description:
        "Get your unique tipping link to share anywhere: social media, email, or business cards. Make it easy for customers to tip you instantly.",
      imageSrc:
        "https://images.stockcake.com/public/2/e/a/2ea05fe5-52bb-49ea-9575-77cddf464208_large/focused-content-creator-stockcake.jpg",
      href: "#",
    },
    {
      id: "qr-code",
      title: "QR Code Support",
      description:
        "Display your QR code for customers to scan and tip on the spot. Perfect for in-person interactions: simple, fast, and contactless.",
      imageSrc:
        "https://images.stockcake.com/public/6/d/a/6da6a5d8-cfed-465e-9473-7978eaff661c_large/neon-pricing-tiers-stockcake.jpg",
      href: "#",
    },
    {
      id: "wallet-balance",
      title: "Real-Time Wallet Balance",
      description:
        "Track your earnings instantly. See your current balance and recent tips in real-time, so you always know exactly what you've earned.",
      imageSrc:
        "https://images.stockcake.com/public/3/d/1/3d172849-8ccb-4844-8d60-07f88626629d_large/analyzing-financial-data-stockcake.jpg",
      href: "#",
    },
    {
      id: "fast-withdrawals",
      title: "Fast Withdrawals to Your Bank",
      description:
        "Cash out your tips anytime with secure, fast transfers directly to your bank account. Your money, when you need it.",
      imageSrc:
        "https://images.stockcake.com/public/d/c/0/dc0cfe3e-8536-4928-98c3-05d67ad5c54b_large/secure-digital-access-stockcake.jpg",
      href: "#",
    },
    {
      id: "secure-safe",
      title: "Secure and Safe",
      description:
        "Your earnings and personal information are protected with bank-level encryption and industry-leading security standards. Tip with confidence.",
      imageSrc:
        "https://images.stockcake.com/public/d/b/8/db8d7896-1942-4dd8-871c-32d2b4a24ad5_large/connected-by-tech-stockcake.jpg",
      href: "#",
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
            Everything you need to receive tips
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, powerful tools designed to help you get paid directly by customers, anytime, anywhere.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <CardStack
            items={features}
            initialIndex={0}
            autoAdvance={true}
            intervalMs={3500}
            pauseOnHover={true}
            showDots={true}
            cardWidth={cardSize.width}
            cardHeight={cardSize.height}
            maxVisible={5}
          />
        </motion.div>
      </div>
    </section>
  );
}
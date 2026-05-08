import { motion } from "motion/react";
import tableQrImg from "../../../../images/table_QR.png";
import atReceptionImg from "../../../../images/At_reception.png";
import salonImg from "../../../../images/salon.jpeg";
import homeImg from "../../../../images/home.jpeg";

const scenarios = [
  {
    headline: "At the table",
    text: "Customers scan a QR code placed on the table and tip instantly, with no waiting and no cash.",
    img: tableQrImg,
    alt: "QR code on a restaurant table for instant tipping",
  },
  {
    headline: "At reception",
    text: "Guests tip staff quickly at check-in or check-out with a simple scan.",
    img: atReceptionImg,
    alt: "Hotel reception with guest tipping at check-in or check-out",
  },
  {
    headline: "After service",
    text: "Clients show appreciation right after their service, fast and seamless.",
    img: salonImg,
    alt: "Salon after a service",
  },
  {
    headline: "On the go",
    text: "Customers tip from anywhere using a shared link or QR code.",
    img: homeImg,
    alt: "Home and mobile service tipping moment",
  },
] as const;

export function LandingRealLifeSection() {
  return (
    <section
      id="real-life"
      className="scroll-mt-[80px] bg-white px-6 py-16 sm:py-20 lg:py-24 dark:bg-neutral-950"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-balance text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-4xl md:text-5xl"
          >
            How CareTip works in real life
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-7">
          {scenarios.map((item, idx) => (
            <motion.article
              key={item.headline}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none"
            >
              <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <img
                  src={item.img}
                  alt={item.alt}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5 sm:p-5 lg:p-6">
                <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-xl">
                  {item.headline}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-base">
                  {item.text}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { SaasDashboard3DHeroCore } from "./SaasDashboard3DHeroCore";

const easeOut = [0.16, 1, 0.3, 1] as const;

type SaasDashboard3DHeroProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  className?: string;
};

/**
 * Full-width marketing hero: copy + shared 3D canvas (`SaasDashboard3DHeroCore`).
 */
export function SaasDashboard3DHero({
  eyebrow = "Product showcase",
  title = "Your command center, in three dimensions",
  subtitle = "Glass surfaces, live motion, and depth that sells trust: built for modern fintech and healthtech brands.",
  className = "",
}: SaasDashboard3DHeroProps) {
  return (
    <section
      className={`relative isolate overflow-hidden ${className}`}
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(99,102,241,0.35) 0%, transparent 55%), linear-gradient(180deg, #070b1a 0%, #0c1228 38%, #050814 100%)",
      }}
    >
      <div className="relative z-[2] mx-auto max-w-6xl px-4 pt-14 pb-6 md:pt-20 md:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: easeOut }}
          className="mb-8 text-center md:mb-10"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/90 md:text-sm">
            {eyebrow}
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm text-slate-400 md:text-base">{subtitle}</p>
        </motion.div>

        <SaasDashboard3DHeroCore variant="full" />
      </div>
    </section>
  );
}

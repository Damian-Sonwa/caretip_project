import { motion } from "motion/react";
import { QrCode } from "lucide-react";

const ACCENT = "#EB992C";

const PARTICLE_COUNT = 14;

/** Spinning gold QR with floating accent particles for the employee dashboard hero. */
export function RealTimeTipPulseGraphic() {
  return (
    <div className="relative flex h-full min-h-[240px] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-black lg:min-h-[300px]">
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const left = ((i * 37 + 11) % 92) + 4;
        const top = ((i * 23 + 19) % 88) + 6;
        const size = 3 + (i % 4);
        return (
          <motion.span
            key={i}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              backgroundColor: ACCENT,
              boxShadow: `0 0 ${6 + (i % 3) * 2}px ${ACCENT}66`,
            }}
            initial={{ opacity: 0.35, y: 0 }}
            animate={{
              y: [0, -18, -6, -22, 0],
              opacity: [0.35, 0.95, 0.55, 0.85, 0.35],
            }}
            transition={{
              duration: 3.2 + (i % 5) * 0.35,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.12,
            }}
          />
        );
      })}

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 56, repeat: Infinity, ease: "linear" }}
        aria-hidden
      >
        <QrCode
          className="h-[7.5rem] w-[7.5rem] sm:h-36 sm:w-36 drop-shadow-[0_0_28px_rgba(235,153,44,0.45)]"
          stroke={ACCENT}
          strokeWidth={1.15}
          fill="none"
        />
      </motion.div>

      <p className="pointer-events-none absolute bottom-5 left-0 right-0 z-20 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#EB992C]/90">
        Real-time tip pulse
      </p>
    </div>
  );
}

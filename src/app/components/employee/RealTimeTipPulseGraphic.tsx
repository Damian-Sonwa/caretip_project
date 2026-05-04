import { motion } from "motion/react";
import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT = "#EB992C";

const PARTICLE_COUNT = 14;

export type RealTimeTipPulseGraphicProps = {
  className?: string;
  /** Caps height in the hero column (same idea as business 3D `embedMaxHeight`). */
  maxHeight?: string;
};

/** Spinning gold QR with floating accent particles for the employee dashboard hero (tight aspect-ratio layout). */
export function RealTimeTipPulseGraphic({
  className,
  maxHeight = "min(340px, min(44svh, 92vw))",
}: RealTimeTipPulseGraphicProps) {
  return (
    <div className={cn("relative isolate w-full max-w-full overflow-hidden rounded-xl touch-manipulation", className)}>
      <div
        className="relative mx-auto w-full min-w-0 max-w-[min(600px,100%)] lg:max-w-none"
        style={{ aspectRatio: "5 / 3", maxHeight }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-lg bg-gradient-to-br from-neutral-950 via-neutral-900 to-black">
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
            className="relative z-10 flex h-full flex-col items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 56, repeat: Infinity, ease: "linear" }}
            aria-hidden
          >
            <QrCode
              className="h-[clamp(4.5rem,22vw,7.5rem)] w-[clamp(4.5rem,22vw,7.5rem)] sm:h-32 sm:w-32 drop-shadow-[0_0_28px_rgba(235,153,44,0.45)]"
              stroke={ACCENT}
              strokeWidth={1.15}
              fill="none"
            />
          </motion.div>

          <p className="pointer-events-none absolute bottom-2 left-0 right-0 z-20 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#EB992C]/90 sm:bottom-3 sm:text-[11px]">
            Real-time tip pulse
          </p>
        </div>
      </div>
    </div>
  );
}

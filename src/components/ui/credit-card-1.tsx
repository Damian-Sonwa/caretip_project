import * as React from "react";
import { Eye, EyeOff, Wifi } from "lucide-react";
import { motion, useMotionValue, useTransform } from "motion/react";

import { cn } from "@/lib/utils";

const PERSPECTIVE = 1000;
const CARD_ANIMATION_DURATION = 0.6;
const INITIAL_DELAY = 0.2;

export interface InteractiveCreditCardProps extends React.HTMLAttributes<HTMLDivElement> {
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  variant?: "gradient" | "dark" | "glass" | "caretip";
  backLine1?: string;
  backLine2?: string;
  /** Disable tilt interaction (recommended on touch). */
  disableTilt?: boolean;
}

export function InteractiveCreditCard({
  cardNumber = "4532 1234 5678 9010",
  cardHolder = "CARETIP GUEST",
  expiryDate = "12/28",
  cvv = "123",
  variant = "caretip",
  backLine1 = "Payments processed by Stripe.",
  backLine2 = "Card details are never stored by CareTip.",
  disableTilt = false,
  className,
  ...props
}: InteractiveCreditCardProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isClicked, setIsClicked] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [8, -8]);
  const rotateYMotion = useTransform(x, [-100, 100], [-8, 8]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disableTilt || prefersReducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const getMaskedNumber = (number: string) => {
    const cleaned = number.replace(/\s/g, "");
    const lastFour = cleaned.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  };

  const variantStyles = {
    gradient: "bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600",
    dark: "bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900",
    glass: "border border-white/20 bg-white/15 backdrop-blur-xl dark:bg-white/10",
    caretip:
      "bg-gradient-to-br from-[#c2410c] via-[#e9781c] to-[#f59e0b] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
  };

  const flipCard = () => {
    setIsClicked(true);
    window.setTimeout(() => setIsClicked(false), 200);
    window.setTimeout(() => setIsFlipped((prev) => !prev), 100);
  };

  return (
    <div
      className={cn("caretip-interactive-credit-card relative w-full", className)}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-primary/12 opacity-80 blur-2xl sm:-inset-6 dark:bg-primary/8"
        aria-hidden
      />

      <motion.div
        className="caretip-interactive-credit-card__stage relative mx-auto aspect-[1.586/1] w-full max-w-[20rem] sm:max-w-[23rem] lg:max-w-[26rem]"
        style={{ perspective: PERSPECTIVE }}
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: CARD_ANIMATION_DURATION, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="relative h-full w-full cursor-pointer"
          style={{
            transformStyle: "preserve-3d",
            rotateX: disableTilt || prefersReducedMotion ? 0 : rotateX,
            rotateY: isFlipped ? 180 : disableTilt || prefersReducedMotion ? 0 : rotateYMotion,
          }}
          animate={{ scale: isClicked ? 0.97 : 1 }}
          transition={{ duration: 0.35, type: "spring", stiffness: 120, damping: 18 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={flipCard}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              flipCard();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Interactive secure payment card preview"
        >
          <motion.div
            className={cn(
              "absolute inset-0 rounded-2xl p-5 shadow-2xl sm:p-6",
              variantStyles[variant],
            )}
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/12 to-white/0"
                animate={prefersReducedMotion ? undefined : { x: ["-100%", "100%"] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "linear",
                }}
              />
            </div>

            <div className="relative flex h-full flex-col justify-between text-white">
              <div className="flex items-start justify-between gap-2">
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{ delay: INITIAL_DELAY }}
                  className="flex items-center gap-3"
                >
                  <div className="h-8 w-11 rounded bg-gradient-to-br from-amber-500 to-yellow-600 shadow-inner sm:h-9 sm:w-12" />
                  <Wifi className="h-5 w-5 rotate-90 sm:h-6 sm:w-6" aria-hidden />
                </motion.div>

                <motion.button
                  type="button"
                  className="rounded-full bg-white/20 p-1.5 transition-colors hover:bg-white/30"
                  initial={prefersReducedMotion ? false : { scale: 0 }}
                  animate={prefersReducedMotion ? undefined : { scale: 1 }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 15 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsVisible((prev) => !prev);
                  }}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                  aria-label={isVisible ? "Hide card details" : "Show card details"}
                >
                  {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </motion.button>
              </div>

              <motion.div
                className="font-mono text-lg tracking-wider sm:text-xl"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
              >
                {isVisible ? cardNumber : getMaskedNumber(cardNumber)}
              </motion.div>

              <div className="flex items-end justify-between gap-3">
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.36 }}
                >
                  <div className="mb-0.5 text-[10px] uppercase opacity-75">Card holder</div>
                  <div className="text-xs font-medium tracking-wide sm:text-sm">{cardHolder}</div>
                </motion.div>

                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.42 }}
                >
                  <div className="mb-0.5 text-[10px] uppercase opacity-75">Expires</div>
                  <div className="text-xs font-medium sm:text-sm">
                    {isVisible ? expiryDate : "••/••"}
                  </div>
                </motion.div>

                <motion.div
                  className="text-xl font-bold italic sm:text-2xl"
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                  transition={{ delay: 0.48, type: "spring", stiffness: 200 }}
                >
                  VISA
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={cn("absolute inset-0 rounded-2xl shadow-2xl", variantStyles[variant])}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="absolute left-0 right-0 top-6 h-10 bg-black/80 sm:top-8 sm:h-12" />
            <div className="absolute left-4 right-4 top-20 flex h-9 items-center justify-end rounded bg-white/90 px-3 sm:left-6 sm:right-6 sm:top-24 sm:h-10">
              <span className="font-mono text-sm font-bold text-black">
                {isVisible ? cvv : "•••"}
              </span>
            </div>
            <div className="absolute bottom-6 left-5 right-5 space-y-1 text-[10px] text-white/75 sm:bottom-8 sm:left-7 sm:right-7">
              <p>{backLine1}</p>
              <p>{backLine2}</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

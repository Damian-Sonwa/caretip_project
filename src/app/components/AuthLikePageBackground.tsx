import { motion } from "motion/react";

type AuthLikePageBackgroundProps = {
  /** Public pages use static gradients — no infinite compositor loops after paint. */
  animated?: boolean;
};

/** Soft white canvas + warm orange blurs — matches auth / How it works pages */
export function AuthLikePageBackground({ animated = true }: AuthLikePageBackgroundProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 isolate overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-[hsl(33_90%_97%)] via-white to-[hsl(33_40%_98%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
        aria-hidden
      />
      <div
        className="absolute top-0 left-1/2 h-[45vh] w-[100vh] -translate-x-1/2 rounded-b-[50%] bg-[hsl(33_82%_55%_/_0.12)] blur-[90px]"
        aria-hidden
      />
      {animated ? (
        <>
          <motion.div
            className="absolute top-0 left-1/2 h-[40vh] w-[85vh] -translate-x-1/2 rounded-b-full bg-[hsl(33_90%_60%_/_0.08)] blur-[70px]"
            animate={{ opacity: [0.35, 0.55, 0.35], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }}
            aria-hidden
          />
          <motion.div
            className="absolute bottom-0 left-1/2 h-[55vh] w-[75vh] -translate-x-1/2 rounded-t-full bg-[hsl(33_70%_85%_/_0.35)] blur-[70px]"
            animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.04, 1] }}
            transition={{ duration: 6, repeat: Infinity, repeatType: "mirror", delay: 0.5 }}
            aria-hidden
          />
          <div
            className="absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full bg-white opacity-80 blur-[90px]"
            aria-hidden
          />
          <div
            className="absolute right-1/4 bottom-1/4 h-64 w-64 animate-pulse rounded-full bg-[hsl(33_82%_55%_/_0.06)] blur-[90px] [animation-delay:500ms]"
            aria-hidden
          />
        </>
      ) : (
        <>
          <div
            className="absolute top-0 left-1/2 h-[40vh] w-[85vh] -translate-x-1/2 rounded-b-full bg-[hsl(33_90%_60%_/_0.08)] blur-[70px] opacity-45"
            aria-hidden
          />
          <div
            className="absolute bottom-0 left-1/2 h-[55vh] w-[75vh] -translate-x-1/2 rounded-t-full bg-[hsl(33_70%_85%_/_0.35)] blur-[70px] opacity-50"
            aria-hidden
          />
        </>
      )}
    </div>
  );
}

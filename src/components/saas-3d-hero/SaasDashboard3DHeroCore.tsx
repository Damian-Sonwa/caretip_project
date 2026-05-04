import { Suspense, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import { useMediaQuery } from "@react-hook/media-query";
import { DashboardScene } from "./DashboardScene";

const easeOut = [0.16, 1, 0.3, 1] as const;

export type SaasDashboard3DHeroCoreVariant = "full" | "embed";

type SaasDashboard3DHeroCoreProps = {
  variant: SaasDashboard3DHeroCoreVariant;
  className?: string;
  /**
   * When `variant` is `embed`, caps visual height (CSS), e.g. `min(340px, 38vh)`.
   * Width is always 100% of parent; height follows `aspect-[5/3]` up to this cap.
   */
  embedMaxHeight?: string;
};

/**
 * Shared WebGL block: gradient shell, vignette, R3F canvas.
 * Embed variant uses aspect-ratio + max-height so the canvas scales with width without leaving a tall empty band.
 */
export function SaasDashboard3DHeroCore({
  variant,
  className = "",
  embedMaxHeight = "min(340px, min(42svh, 92vw))",
}: SaasDashboard3DHeroCoreProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)") === true;
  const narrow = useMediaQuery("(max-width: 767px)") === true;

  const dpr: [number, number] = useMemo(() => (narrow ? [1, 1] : [1, 1.5]), [narrow]);
  const reflectorResolution = narrow ? 256 : 512;

  const fullCanvasHeight = narrow ? "min(48svh, 420px)" : "min(54svh, 520px)";

  if (variant === "embed") {
    return (
      <div
        className={cn("relative isolate w-full overflow-hidden rounded-xl", className)}
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(99,102,241,0.35) 0%, transparent 55%), linear-gradient(180deg, #070b1a 0%, #0c1228 38%, #050814 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(ellipse 65% 55% at 50% 42%, transparent 25%, rgba(5,8,20,0.5) 100%), radial-gradient(ellipse 90% 70% at 50% 100%, rgba(5,8,20,0.65) 0%, transparent 45%)",
          }}
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.04, ease: easeOut }}
          className="relative z-[2] w-full min-w-0 max-w-[min(600px,100%)] lg:max-w-none"
        >
          <div className="relative w-full" style={{ aspectRatio: "5 / 3", maxHeight: embedMaxHeight }}>
            <div
              className="absolute inset-0 overflow-hidden rounded-lg ring-1 ring-white/[0.08]"
              style={{
                boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 16px 48px rgba(0,0,0,0.35)",
              }}
            >
              <Canvas
                shadows
                dpr={dpr}
                className="touch-none"
                style={{ width: "100%", height: "100%", display: "block" }}
                camera={{ fov: 35, position: [0, 0.35, 6.15], near: 0.1, far: 45 }}
                gl={{
                  alpha: true,
                  antialias: true,
                  powerPreference: "high-performance",
                  stencil: false,
                  depth: true,
                }}
                onCreated={({ gl }) => {
                  gl.setClearColor(0x000000, 0);
                }}
              >
                <Suspense fallback={null}>
                  <DashboardScene reducedMotion={prefersReducedMotion} reflectorResolution={reflectorResolution} />
                </Suspense>
              </Canvas>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative isolate overflow-hidden", className)}
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(99,102,241,0.35) 0%, transparent 55%), linear-gradient(180deg, #070b1a 0%, #0c1228 38%, #050814 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 42%, transparent 25%, rgba(5,8,20,0.5) 100%), radial-gradient(ellipse 90% 70% at 50% 100%, rgba(5,8,20,0.65) 0%, transparent 45%)",
        }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.12, ease: easeOut }}
        className="relative z-[2] mx-auto w-full max-w-5xl px-0"
        style={{ height: fullCanvasHeight }}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-3xl ring-1 ring-white/[0.08]"
          style={{
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 40px 120px rgba(0,0,0,0.45)",
          }}
        >
          <Canvas
            shadows
            dpr={dpr}
            style={{ width: "100%", height: "100%", display: "block" }}
            camera={{ fov: 35, position: [0, 0.35, 6.15], near: 0.1, far: 45 }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: "high-performance",
              stencil: false,
              depth: true,
            }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
            }}
          >
            <Suspense fallback={null}>
              <DashboardScene reducedMotion={prefersReducedMotion} reflectorResolution={reflectorResolution} />
            </Suspense>
          </Canvas>
        </div>
      </motion.div>
    </div>
  );
}

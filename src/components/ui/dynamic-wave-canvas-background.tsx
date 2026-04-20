import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const SCALE = 2;

/**
 * Full-bleed animated wave canvas for section backgrounds.
 * Fills its parent (use a `relative` wrapper with defined height).
 */
function HeroWave({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let imageData: ImageData;
    let data: Uint8ClampedArray;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = w;
      canvas.height = h;
      width = Math.floor(canvas.width / SCALE);
      height = Math.floor(canvas.height / SCALE);
      imageData = ctx.createImageData(width, height);
      data = imageData.data;
    };

    const ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(container);
    resizeCanvas();

    const startTime = Date.now();

    const SIN_TABLE = new Float32Array(1024);
    const COS_TABLE = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const angle = (i / 1024) * Math.PI * 2;
      SIN_TABLE[i] = Math.sin(angle);
      COS_TABLE[i] = Math.cos(angle);
    }

    const fastSin = (x: number) => {
      const index =
        Math.floor(((x % (Math.PI * 2)) / (Math.PI * 2)) * 1024) & 1023;
      return SIN_TABLE[index]!;
    };

    const fastCos = (x: number) => {
      const index =
        Math.floor(((x % (Math.PI * 2)) / (Math.PI * 2)) * 1024) & 1023;
      return COS_TABLE[index]!;
    };

    let rafId = 0;

    const render = () => {
      if (width < 2 || height < 2 || !data) {
        rafId = requestAnimationFrame(render);
        return;
      }

      const time = (Date.now() - startTime) * 0.001;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const u_x = (2 * x - width) / height;
          const u_y = (2 * y - height) / height;

          let a = 0;
          let d = 0;

          for (let i = 0; i < 4; i++) {
            a += fastCos(i - d + time * 0.5 - a * u_x);
            d += fastSin(i * u_y + a);
          }

          const wave = (fastSin(a) + fastCos(d)) * 0.5;
          const intensity = 0.3 + 0.4 * wave;
          const baseVal = 0.1 + 0.15 * fastCos(u_x + u_y + time * 0.3);
          const warm = 0.12 * fastSin(a * 1.5 + time * 0.2);
          const amber = 0.18 * fastCos(d * 2 + time * 0.1);

          const r =
            Math.max(0, Math.min(1, baseVal + amber * 0.95 + warm * 0.5)) *
            intensity;
          const g =
            Math.max(0, Math.min(1, baseVal + amber * 0.55 + warm * 0.35)) *
            intensity;
          const b =
            Math.max(0, Math.min(1, baseVal + warm * 0.85 + amber * 0.25)) *
            intensity;

          const idx = (y * width + x) * 4;
          data[idx] = r * 255;
          data[idx + 1] = g * 255;
          data[idx + 2] = b * 255;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      if (SCALE > 1) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          canvas,
          0,
          0,
          width,
          height,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [reduceMotion]);

  if (reduceMotion) {
    return (
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-muted/40 via-background to-muted/30",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

export default HeroWave;

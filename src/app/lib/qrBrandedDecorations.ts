import type { QrDesignSystem } from "./qrDesignSystem";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(235, 153, 44, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function drawDesignBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: string,
  accent: string,
  system: QrDesignSystem,
): void {
  if (system.background.style === "gradient" && system.background.secondaryTint) {
    const angle = ((system.background.gradientAngle ?? 180) * Math.PI) / 180;
    const cx = w / 2;
    const cy = h / 2;
    const len = Math.max(w, h);
    const x1 = cx - Math.cos(angle) * len;
    const y1 = cy - Math.sin(angle) * len;
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, bg);
    grad.addColorStop(1, system.background.secondaryTint);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = bg;
  }
  ctx.fillRect(0, 0, w, h);

  if (system.background.style === "texture") {
    ctx.fillStyle = hexToRgba(accent, 0.03);
    for (let y = 0; y < h; y += 8) {
      for (let x = 0; x < w; x += 8) {
        if ((x + y) % 16 === 0) ctx.fillRect(x, y, 2, 2);
      }
    }
  }
}

export function drawDesignDecorations(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  lightText: boolean,
  system: QrDesignSystem,
  enabled: boolean,
  qrSafeTop: number,
  qrSafeBottom: number,
): void {
  if (!enabled) return;
  const stroke = lightText ? hexToRgba(accent, 0.85) : accent;
  const faint = lightText ? "rgba(245,245,245,0.25)" : hexToRgba(accent, 0.2);

  for (const layer of system.decorations) {
    if (!layer.enabled) continue;
    if (layer.kind === "corners") {
      const len = 18;
      const pad = 10;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      const corners: Array<[number, number, number, number, number, number]> = [
        [pad, pad + len, pad, pad, pad + len, pad],
        [w - pad, pad + len, w - pad, pad, w - pad - len, pad],
        [pad, h - pad - len, pad, h - pad, pad + len, h - pad],
        [w - pad, h - pad - len, w - pad, h - pad, w - pad - len, h - pad],
      ];
      for (const [x1, y1, x2, y2, x3, y3] of corners) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.stroke();
      }
    }
    if (layer.kind === "glow" && system.templateId === "nightlife") {
      ctx.strokeStyle = hexToRgba(accent, 0.35);
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, w - 12, h - 12);
    }
    if (layer.kind === "pattern" && system.templateId === "nature") {
      ctx.fillStyle = faint;
      for (let i = 0; i < 6; i++) {
        const x = 12 + i * 22;
        const y = qrSafeTop - 14 + (i % 2) * 4;
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 3, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (layer.kind === "accent") {
      ctx.fillStyle = faint;
      ctx.fillRect(0, qrSafeTop - 6, w, 1);
      ctx.fillRect(0, qrSafeBottom + 5, w, 1);
    }
  }
}

export function drawHeaderVenueLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  centerX: number,
  y: number,
  maxW: number,
  maxH: number,
): void {
  const ratio = img.naturalHeight / img.naturalWidth;
  let w = maxW;
  let h = ratio * w;
  if (h > maxH) {
    h = maxH;
    w = h / ratio;
  }
  ctx.drawImage(img, centerX - w / 2, y, w, h);
}

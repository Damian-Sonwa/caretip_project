import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateDir = path.join(root, "template");
const destDir = path.join(root, "src/assets/qr-templates/backgrounds");

/** OneDrive placeholders need the Win32 extended path prefix on Windows. */
function extPath(p) {
  if (process.platform !== "win32") return p;
  const normalized = path.resolve(p);
  if (normalized.startsWith("\\\\?\\")) return normalized;
  return `\\\\?\\${normalized}`;
}

const picks = [
  ["beach-resort.jpg", "Luxury beach resort"],
  ["spa-retreat.jpg", "Luxury spa"],
  [
    "vip-lounge.jpg",
    "Luxury VIP lounge display background, black background with gold lighting effects, premium nightlife atmosphere, exclusive and elegant aesthetic, sophisticated club branding style, dramatic ambient lighting, refin",
  ],
  [
    "scandinavian.jpg",
    "Minimal Scandinavian QR card background design, warm white background with subtle beige tones, clean geometric lines, lots of negative space, modern minimalist aesthetic, premium cafe branding style, simple elegan",
  ],
  [
    "premium-noir.jpg",
    "Premium hospitality QR card background design, sophisticated black and deep charcoal gradient background, elegant gold accent borders and decorative corner elements, subtle ambient lighting effects, refined orname",
  ],
  ["city-cafe.jpg", "Trendy upscale city"],
  ["gallery-white.jpg", "Ultra-clean premium display"],
];

fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(templateDir);

for (const [outName, prefix] of picks) {
  const match = files.find((f) => f.startsWith(prefix));
  if (!match) {
    console.error("MISSING prefix:", prefix);
    process.exitCode = 1;
    continue;
  }
  const src = path.join(templateDir, match);
  const dest = path.join(destDir, outName);
  fs.copyFileSync(extPath(src), dest);
  console.log("COPIED", outName);
}

async function measureZones(file) {
  const meta = await sharp(file).metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let minX = W;
  let minY = H;
  let maxX = 0;
  let maxY = 0;
  let count = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * ch;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 215 && g > 215 && b > 215) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (count < 500) return { W, H, fallback: true };
  const qr = {
    x: +(((minX + maxX) / 2) / W).toFixed(4),
    y: +(minY / H).toFixed(4),
    w: +((maxX - minX + 1) / W).toFixed(4),
    h: +((maxY - minY + 1) / H).toFixed(4),
  };
  const brandingH = Math.max(0.12, +(qr.y - 0.01).toFixed(4));
  const ctaY = +(qr.y + qr.h).toFixed(4);
  const footerY = +Math.min(0.895, ctaY + 0.08).toFixed(4);
  return {
    W,
    H,
    zones: {
      brandingZone: { x: 0.5, y: 0, w: 0.78, h: brandingH, align: "center", valign: "top" },
      qrZone: { x: qr.x, y: qr.y, w: qr.w, h: qr.h, align: "center", valign: "top" },
      ctaZone: { x: 0.5, y: ctaY, w: 0.52, h: 0.09, align: "center", valign: "top" },
      footerZone: {
        x: 0.5,
        y: footerY,
        w: 0.86,
        h: +(1 - footerY - 0.05).toFixed(4),
        align: "center",
        valign: "top",
      },
    },
  };
}

for (const f of fs.readdirSync(destDir).filter((x) => /\.(jpg|jpeg|png)$/i.test(x))) {
  const z = await measureZones(path.join(destDir, f));
  console.log(f, JSON.stringify(z));
}

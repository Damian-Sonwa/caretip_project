/**
 * Generates WebP + AVIF variants for LCP-critical marketing assets.
 * Run: node scripts/optimize-lcp-images.mjs
 */
import { readFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

/** @type {{ inPath: string; outBase: string; maxWidth: number }[]} */
const TARGETS = [
  { inPath: "images/story-hero01.png", outBase: "images/story-hero01", maxWidth: 1344 },
  { inPath: "images/story-hero02.png", outBase: "images/story-hero02", maxWidth: 1344 },
  { inPath: "src/assets/brand/company_logo.png", outBase: "src/assets/brand/company_logo", maxWidth: 640 },
  { inPath: "images/Volle.png", outBase: "images/Volle", maxWidth: 1200 },
  { inPath: "images/payment-infrastructure.png", outBase: "images/payment-infrastructure", maxWidth: 1200 },
  { inPath: "images/logy.png", outBase: "images/logy", maxWidth: 960 },
  { inPath: "images/rep.png", outBase: "images/rep", maxWidth: 960 },
  { inPath: "images/hospital002.png", outBase: "images/hospital002", maxWidth: 960 },
  { inPath: "images/FYP.jpeg", outBase: "images/FYP", maxWidth: 960 },
  { inPath: "images/home.jpeg", outBase: "images/home", maxWidth: 960 },
];

async function writeVariants({ inPath, outBase, maxWidth }) {
  const absIn = join(root, inPath);
  const buf = await readFile(absIn);
  const resized = sharp(buf).resize({ width: maxWidth, withoutEnlargement: true });

  const webpPath = join(root, `${outBase}.webp`);
  const avifPath = join(root, `${outBase}.avif`);

  await mkdir(dirname(webpPath), { recursive: true });
  await resized.clone().webp({ quality: 82, effort: 4 }).toFile(webpPath);
  await resized.clone().avif({ quality: 55, effort: 4 }).toFile(avifPath);

  return {
    inPath,
    webp: `${outBase}.webp`,
    avif: `${outBase}.avif`,
    maxWidth,
    webpBytes: (await readFile(webpPath)).length,
    avifBytes: (await readFile(avifPath)).length,
  };
}

const results = [];
for (const target of TARGETS) {
  results.push(await writeVariants(target));
}

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

/**
 * Generates WebP companions for large marketing assets (hero + landing sections).
 * Run manually: node scripts/optimize-marketing-images.mjs
 */
import { readdir, stat } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagesDir = join(__dirname, "..", "images");
const MIN_BYTES = 512 * 1024;
const TARGET_BYTES = 200 * 1024;

/** Always optimize landing heroes even if under MIN_BYTES threshold changes. */
const PRIORITY = new Set([
  "cca.png",
  "en-hero.png",
  "new-hero.png",
  "Log01.png",
  "At_reception.png",
  "Mit.png",
  "English-version.png",
  "FYP.jpeg",
  "newly01.png",
  "live-in-minutes.jpeg",
  "beauty-r.png",
  "caretip-image.png",
  "cafe-employee.png",
]);

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg"]);

async function writeWebp(inputPath, baseName) {
  const outPath = join(imagesDir, `${baseName}.webp`);
  let quality = 84;
  let lastSize = Infinity;

  while (quality >= 68) {
    const buf = await sharp(inputPath)
      .rotate()
      .webp({ quality, effort: 6, smartSubsample: true })
      .toBuffer();
    lastSize = buf.length;
    if (lastSize <= TARGET_BYTES || quality <= 70) {
      await sharp(buf).toFile(outPath);
      return { outPath, bytes: lastSize, quality };
    }
    quality -= 4;
  }

  const buf = await sharp(inputPath)
    .rotate()
    .webp({ quality: 68, effort: 6, smartSubsample: true })
    .toBuffer();
  await sharp(buf).toFile(outPath);
  return { outPath, bytes: buf.length, quality: 68 };
}

async function main() {
  const entries = await readdir(imagesDir);
  const results = [];

  for (const name of entries) {
    const ext = extname(name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    const inputPath = join(imagesDir, name);
    const { size } = await stat(inputPath);
    if (size < MIN_BYTES && !PRIORITY.has(name)) continue;

    const baseName = name.slice(0, -ext.length);
    const { bytes, quality } = await writeWebp(inputPath, baseName);
    results.push({
      name,
      inputKb: Math.round(size / 1024),
      webpKb: Math.round(bytes / 1024),
      quality,
    });
  }

  results.sort((a, b) => b.inputKb - a.inputKb);
  console.log(`Optimized ${results.length} image(s):`);
  for (const r of results) {
    console.log(`  ${r.name}: ${r.inputKb} KB → ${r.webpKb} KB (q=${r.quality})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

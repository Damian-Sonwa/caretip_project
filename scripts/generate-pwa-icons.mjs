/**
 * Builds install / manifest icons from the official CareTip logo asset.
 *
 * IMPORTANT:
 * - Do not add borders/plates/frames/background boxes.
 * - Use the logo as-is (standalone).
 *
 * Splash must not use a monochrome mask — Android maskable + some launch paths
 * can render icons as silhouettes; we only ship `purpose: "any"` in the manifest.
 *
 * Pipeline:
 * - Resize "contain" into a square canvas (no extra framing, just padding as needed)
 * - Write PNG outputs for manifest, apple touch, and favicon
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const logoPath = join(root, 'src/assets/brand/company_logo.png')

async function writeSquarePng({ outName, size }) {
  const buf = await readFile(logoPath)
  await sharp(buf)
    .resize(size, size, {
      fit: 'contain',
      // If the source has transparency, preserve it. If it doesn't, Sharp will
      // keep the existing background (we still avoid adding any new frame).
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: false,
    })
    .png()
    .toFile(join(root, `public/${outName}`))
}

const outputs = [
  { outName: 'icon-192.png', size: 192 },
  { outName: 'icon-512.png', size: 512 },
  { outName: 'apple-touch-icon.png', size: 180 },
  { outName: 'favicon-32.png', size: 32 },
]

for (const o of outputs) {
  await writeSquarePng(o)
  console.log(`Wrote public/${o.outName}`)
}

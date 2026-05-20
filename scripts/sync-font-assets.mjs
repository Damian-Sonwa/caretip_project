/**
 * Copies self-hosted Inter + Manrope woff2 assets into public/fonts for
 * early <link rel="preload"> and stable first paint (no @fontsource path drift).
 */
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const assets = [
  ["@fontsource/inter/files/inter-latin-400-normal.woff2", "public/fonts/inter/inter-latin-400.woff2"],
  ["@fontsource/inter/files/inter-latin-500-normal.woff2", "public/fonts/inter/inter-latin-500.woff2"],
  ["@fontsource/inter/files/inter-latin-600-normal.woff2", "public/fonts/inter/inter-latin-600.woff2"],
  ["@fontsource/inter/files/inter-latin-700-normal.woff2", "public/fonts/inter/inter-latin-700.woff2"],
  ["@fontsource/inter/files/inter-latin-800-normal.woff2", "public/fonts/inter/inter-latin-800.woff2"],
  ["@fontsource/manrope/files/manrope-latin-600-normal.woff2", "public/fonts/manrope/manrope-latin-600.woff2"],
  ["@fontsource/manrope/files/manrope-latin-700-normal.woff2", "public/fonts/manrope/manrope-latin-700.woff2"],
  ["@fontsource/manrope/files/manrope-latin-800-normal.woff2", "public/fonts/manrope/manrope-latin-800.woff2"],
];

await Promise.all(
  assets.map(async ([fromRel, toRel]) => {
    const dest = join(root, toRel);
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(join(root, "node_modules", fromRel), dest);
  }),
);

await copyFile(
  join(root, "src/styles/caretip-font-faces.css"),
  join(root, "public/caretip-font-faces.css"),
);

console.log(`Synced ${assets.length} font files + public/caretip-font-faces.css`);

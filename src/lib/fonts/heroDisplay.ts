/**
 * Public marketing headings — Manrope (premium SaaS display).
 * Body/UI remains Inter via `inter.ts`.
 */
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";

export const heroDisplayFontVariable = "--font-hero-display";

export function applyHeroDisplayFontVariable(): void {
  document.documentElement.style.setProperty(
    heroDisplayFontVariable,
    "'Manrope', ui-sans-serif, system-ui, sans-serif",
  );
}

applyHeroDisplayFontVariable();

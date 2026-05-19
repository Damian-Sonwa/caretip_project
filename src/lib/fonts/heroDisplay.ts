/**
 * Landing hero display face — Plus Jakarta Sans (geometric, balanced at large sizes).
 * Body/UI remains Inter via `inter.ts`.
 */
import "@fontsource/plus-jakarta-sans/latin-700.css";
import "@fontsource/plus-jakarta-sans/latin-800.css";

export const heroDisplayFontVariable = "--font-hero-display";

export function applyHeroDisplayFontVariable(): void {
  document.documentElement.style.setProperty(
    heroDisplayFontVariable,
    "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
  );
}

applyHeroDisplayFontVariable();

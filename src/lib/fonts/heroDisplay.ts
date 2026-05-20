/**
 * Manrope (marketing headings) — CSS faces in caretip-font-faces.css; preloaded from index.html.
 */
import { MANROPE_FONT_STACK } from "./fontStacks";

export const heroDisplayFontVariable = "--font-hero-display";

export function applyHeroDisplayFontVariable(): void {
  document.documentElement.style.setProperty(heroDisplayFontVariable, MANROPE_FONT_STACK);
}

if (typeof document !== "undefined") {
  applyHeroDisplayFontVariable();
}

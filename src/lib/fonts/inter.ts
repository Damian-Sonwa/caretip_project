/**
 * Self-hosted Inter (Vite equivalent of next/font/google).
 * Loads before app CSS so --font-inter is available everywhere.
 */
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";

export const interFontVariable = "--font-inter";

/** Apply Inter CSS variable on the document root (call once at startup). */
export function applyInterFontVariable(): void {
  const root = document.documentElement;
  root.classList.add("caretip-font-inter");
  root.style.setProperty(
    interFontVariable,
    "'Inter', ui-sans-serif, system-ui, sans-serif",
  );
}

applyInterFontVariable();

/**
 * Inter — CSS faces in caretip-font-faces.css; preloaded from index.html.
 */
import { INTER_FONT_STACK } from "./fontStacks";

export const interFontVariable = "--font-inter";

export function applyInterFontVariable(): void {
  const root = document.documentElement;
  root.classList.add("caretip-font-inter");
  root.style.setProperty(interFontVariable, INTER_FONT_STACK);
}

if (typeof document !== "undefined") {
  applyInterFontVariable();
}

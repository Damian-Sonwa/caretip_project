/** QR module contrast checks — shared server-side guardrails. */

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export const QR_MIN_MODULE_CONTRAST_RATIO = 3;

function parseHexRgb(hex: string): [number, number, number] | null {
  const raw = String(hex ?? "").trim();
  if (!HEX_COLOR_RE.test(raw)) return null;
  const h = raw.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function relativeLuminance(hex: string): number {
  const rgb = parseHexRgb(hex);
  if (!rgb) return 0;
  const channels = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

export function qrModuleContrastRatio(moduleDark: string, moduleLight: string): number {
  const l1 = relativeLuminance(moduleDark);
  const l2 = relativeLuminance(moduleLight);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function assertQrModuleContrast(moduleDark: string, moduleLight: string): void {
  const ratio = qrModuleContrastRatio(moduleDark, moduleLight);
  if (ratio < QR_MIN_MODULE_CONTRAST_RATIO) {
    throw new Error(
      `QR module colors need stronger contrast (minimum ${QR_MIN_MODULE_CONTRAST_RATIO}:1, got ${ratio.toFixed(1)}:1).`,
    );
  }
}

/** Light module color per template — mirrors frontend presets. */
const TEMPLATE_MODULE_LIGHT: Record<string, string> = {
  classic: "#FFFFFF",
  luxury: "#FFFFFF",
  modern: "#F8FAFC",
  nature: "#FFFFFF",
  corporate: "#FFFFFF",
  nightlife: "#FFFFFF",
  restaurant: "#FFFFFF",
  hotel: "#FFFFFF",
};

export function moduleLightForTemplate(templateId: string): string {
  return TEMPLATE_MODULE_LIGHT[String(templateId).toLowerCase()] ?? "#FFFFFF";
}

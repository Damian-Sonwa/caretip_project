export const QR_TEMPLATES = [
  "industry",
  "velvet-lounge",
  "grand-atelier",
  "royal-suite",
  "champagne-salon",
  "serenity-spa",
  "art-deco-noir",
  "gallery-pavilion",
  "velvet-lounge-noir",
  "grand-atelier-noir",
  "royal-suite-platinum",
  "champagne-salon-classic",
  "poc-luxury-shell",
] as const;



export const QR_BORDER_STYLES = ["none", "rounded", "double", "ornate", "minimal"] as const;



export const QR_SHAPES = ["square", "rounded", "circle"] as const;



export type QrTemplate = (typeof QR_TEMPLATES)[number];

export type QrBorderStyle = (typeof QR_BORDER_STYLES)[number];

export type QrShape = (typeof QR_SHAPES)[number];



export const DEFAULT_QR_TEMPLATE: QrTemplate = "industry";

export const DEFAULT_QR_BORDER_STYLE: QrBorderStyle = "rounded";

export const DEFAULT_QR_SHAPE: QrShape = "square";

export const DEFAULT_QR_BACKGROUND_COLOR = "#FFFFFF";



const LEGACY_QR_TEMPLATES = new Set([

  "classic",

  "luxury",

  "modern",

  "nature",

  "corporate",

  "nightlife",

  "restaurant",

  "hotel",

]);



const DISPLAY_NAME_MAX = 80;

const TAGLINE_MAX = 120;



export function isQrTemplate(value: string): value is QrTemplate {

  return (QR_TEMPLATES as readonly string[]).includes(value);

}



export function isQrBorderStyle(value: string): value is QrBorderStyle {

  return (QR_BORDER_STYLES as readonly string[]).includes(value);

}



export function isQrShape(value: string): value is QrShape {

  return (QR_SHAPES as readonly string[]).includes(value);

}



export function normalizeQrTemplate(value: string | null | undefined): QrTemplate {

  const raw = String(value ?? "").trim().toLowerCase();

  if (LEGACY_QR_TEMPLATES.has(raw)) return DEFAULT_QR_TEMPLATE;

  return isQrTemplate(raw) ? raw : DEFAULT_QR_TEMPLATE;

}



export function normalizeQrBorderStyle(value: string | null | undefined): QrBorderStyle {

  const raw = String(value ?? "").trim().toLowerCase();

  return isQrBorderStyle(raw) ? raw : DEFAULT_QR_BORDER_STYLE;

}



export function normalizeQrShape(value: string | null | undefined): QrShape {

  const raw = String(value ?? "").trim().toLowerCase();

  return isQrShape(raw) ? raw : DEFAULT_QR_SHAPE;

}



export function assertQrTemplate(value: unknown): QrTemplate {

  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (LEGACY_QR_TEMPLATES.has(raw)) return DEFAULT_QR_TEMPLATE;

  if (!isQrTemplate(raw)) {

    throw new Error(`QR template must be one of: ${QR_TEMPLATES.join(", ")}.`);

  }

  return raw;

}



export function assertQrBorderStyle(value: unknown): QrBorderStyle {

  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!isQrBorderStyle(raw)) {

    throw new Error(`QR border style must be one of: ${QR_BORDER_STYLES.join(", ")}.`);

  }

  return raw;

}



export function assertQrShape(value: unknown): QrShape {

  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!isQrShape(raw)) {

    throw new Error(`QR shape must be one of: ${QR_SHAPES.join(", ")}.`);

  }

  return raw;

}



export function trimBrandDisplayName(raw: unknown): string | null {

  if (raw === null || raw === undefined) return null;

  const s = String(raw).trim();

  if (!s) return null;

  if (s.length > DISPLAY_NAME_MAX) {

    throw new Error(`Display name must be at most ${DISPLAY_NAME_MAX} characters.`);

  }

  return s;

}



export function trimBrandTagline(raw: unknown): string | null {

  if (raw === null || raw === undefined) return null;

  const s = String(raw).trim();

  if (!s) return null;

  if (s.length > TAGLINE_MAX) {

    throw new Error(`Tagline must be at most ${TAGLINE_MAX} characters.`);

  }

  return s;

}


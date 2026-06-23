export const DEFAULT_BRAND_PRIMARY_COLOR = "#EB992C";
export const DEFAULT_BRAND_SECONDARY_COLOR = "#000000";

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidBrandHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(String(value ?? "").trim());
}

export function normalizeBrandHexColor(
  value: string | null | undefined,
  fallback: string,
): string {
  const raw = String(value ?? "").trim();
  if (isValidBrandHexColor(raw)) return raw.toUpperCase();
  return fallback.toUpperCase();
}

export function assertValidBrandHexColor(value: unknown, fieldLabel: string): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!isValidBrandHexColor(raw)) {
    throw new Error(`${fieldLabel} must be a 6-digit HEX color (e.g. #EB992C).`);
  }
  return raw.toUpperCase();
}

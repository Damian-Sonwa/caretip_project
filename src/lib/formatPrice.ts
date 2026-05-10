import i18n from "@/i18n/i18n";

/**
 * Locale-aware money display.
 * - `de`: German formatting, EUR (e.g. 10,00 €)
 * - `en` (fallback): US formatting, USD (e.g. $10.00)
 */
export function formatPrice(amount: number): string {
  const lng = i18n.language?.toLowerCase().startsWith("de") ? "de" : "en";
  if (lng === "de") {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Alias for marketing copy that refers to “currency formatting”. */
export const formatCurrency = formatPrice;

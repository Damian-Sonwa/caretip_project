import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

/** Display tips in Nigerian Naira (₦) as requested for employee-facing copy. */
export function formatTipNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function dateLocaleForTag(localeTag?: string) {
  if (localeTag?.toLowerCase().startsWith("de")) return de;
  return enUS;
}

/** Localized date+time for tip rows (uses German locale when UI language is German). */
export function formatTipDateTime(iso: string, localeTag?: string): string {
  const d = new Date(iso);
  return format(d, "Pp", { locale: dateLocaleForTag(localeTag) });
}

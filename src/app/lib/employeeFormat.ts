/** Display tips in Nigerian Naira (₦) as requested for employee-facing copy. */
export function formatTipNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTipDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

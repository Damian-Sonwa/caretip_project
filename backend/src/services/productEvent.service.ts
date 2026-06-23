/** Lightweight product analytics — structured logs for downstream ingestion. */

export type BrandingProductEvent =
  | "branding_logo_uploaded"
  | "branding_banner_uploaded"
  | "branding_colors_changed"
  | "branding_welcome_updated"
  | "branding_thankyou_updated";

export function trackProductEvent(
  event: BrandingProductEvent | string,
  props: Record<string, unknown> = {},
): void {
  try {
    console.info(
      JSON.stringify({
        type: "product_event",
        event,
        at: new Date().toISOString(),
        ...props,
      }),
    );
  } catch {
    // never block request path
  }
}

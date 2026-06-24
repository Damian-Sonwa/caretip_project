/**
 * Bulk staff QR PDF — one Template Engine card per A4 page.
 * Uses the same branded canvas as QR Studio preview / gallery PNGs.
 */

import type { QrBrandingOptions } from "./businessBranding";
import { renderBrandedQRToDataUrl, renderBrandedQRToDataUrlLegacy } from "./qrBranded";
import { createJsPdfDocument } from "./qrPdfLazy";
import {
  embedBrandedTemplateCardOnPage,
  loadBrandedCardDimensions,
} from "./qrPrintPdf";

export type StaffQrPdfRow = {
  id: string;
  name: string;
  businessSlug?: string;
  employeeSlug?: string;
};

export type StaffQrBulkPdfOptions = {
  /** Venue branding — required when cards are not pre-rendered. */
  branding?: Partial<QrBrandingOptions>;
  /** Re-use gallery preview PNGs when available (same pixels as on-screen cards). */
  resolveCardDataUrl?: (employeeId: string) => string | null | undefined;
};

/** A4 multi-page PDF: each page is one full branded template card. */
export async function downloadStaffQrPdf(
  items: StaffQrPdfRow[],
  fileBaseName: string,
  opts?: StaffQrBulkPdfOptions,
): Promise<void> {
  const withId = items.filter((i) => i.id?.trim());
  if (withId.length === 0) return;

  const pdf = await createJsPdfDocument({ unit: "mm", format: "a4", orientation: "portrait" });

  for (let i = 0; i < withId.length; i++) {
    if (i > 0) pdf.addPage();
    const row = withId[i]!;

    let dataUrl = opts?.resolveCardDataUrl?.(row.id)?.trim() || "";
    if (!dataUrl) {
      dataUrl =
        row.businessSlug && row.employeeSlug
          ? await renderBrandedQRToDataUrl(row.businessSlug, row.employeeSlug, opts?.branding)
          : await renderBrandedQRToDataUrlLegacy(row.id, opts?.branding);
    }
    if (!dataUrl) continue;

    const dims = await loadBrandedCardDimensions(dataUrl);
    embedBrandedTemplateCardOnPage(pdf, dataUrl, dims);
  }

  pdf.save(`${fileBaseName}.pdf`);
}

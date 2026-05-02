import { jsPDF } from "jspdf";
import { renderBrandedQRToDataUrl, renderBrandedQRToDataUrlLegacy } from "./qrBranded";

const TEXT_SLATE_RGB: [number, number, number] = [40, 61, 59];

export type StaffQrPdfRow = {
  id: string;
  name: string;
  businessSlug?: string;
  employeeSlug?: string;
};

/**
 * Printable PDF with one branded CareTip QR per page (staff list from Postgres).
 */
export async function downloadStaffQrPdf(items: StaffQrPdfRow[], fileBaseName: string): Promise<void> {
  const withId = items.filter((i) => i.id?.trim());
  if (withId.length === 0) return;

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();

  for (let i = 0; i < withId.length; i++) {
    if (i > 0) pdf.addPage();
    const row = withId[i];

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...TEXT_SLATE_RGB);
    pdf.text(row.name, pageW / 2, 24, { align: "center" });

    const dataUrl =
      row.businessSlug && row.employeeSlug
        ? await renderBrandedQRToDataUrl(row.businessSlug, row.employeeSlug)
        : await renderBrandedQRToDataUrlLegacy(row.id);
    if (!dataUrl) continue;

    const imgSize = 75;
    const x = (pageW - imgSize) / 2;
    pdf.addImage(dataUrl, "PNG", x, 32, imgSize, imgSize);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...TEXT_SLATE_RGB);
    pdf.text("Powered by CareTip Limited", pageW / 2, 32 + imgSize + 10, { align: "center" });
  }

  pdf.save(`${fileBaseName}.pdf`);
}

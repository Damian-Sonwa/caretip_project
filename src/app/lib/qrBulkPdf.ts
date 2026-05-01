import { jsPDF } from "jspdf";
import { renderBrandedQRToDataUrl } from "./qrBranded";

const TEXT_SLATE_RGB: [number, number, number] = [40, 61, 59];
/** Same warm orange as {@link qrPrintPdf} / branded QR frame. */
const BRAND_RGB: [number, number, number] = [233, 147, 47];

/**
 * Printable PDF with one branded CareTip QR per page (staff list from Postgres).
 */
export async function downloadStaffQrPdf(
  items: { id: string; name: string }[],
  fileBaseName: string
): Promise<void> {
  const withId = items.filter((i) => i.id?.trim());
  if (withId.length === 0) return;

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();

  for (let i = 0; i < withId.length; i++) {
    if (i > 0) pdf.addPage();
    const { id, name } = withId[i];

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...TEXT_SLATE_RGB);
    pdf.text(name, pageW / 2, 24, { align: "center" });

    const dataUrl = await renderBrandedQRToDataUrl(id);
    if (!dataUrl) continue;

    const imgSize = 75;
    const x = (pageW - imgSize) / 2;
    pdf.addImage(dataUrl, "PNG", x, 32, imgSize, imgSize);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...BRAND_RGB);
    pdf.text("CareTip Limited", pageW / 2, 32 + imgSize + 12, { align: "center" });
  }

  pdf.save(`${fileBaseName}.pdf`);
}

import { jsPDF } from "jspdf";
import { renderBrandedQRToDataUrl, renderBrandedQRToDataUrlLegacy } from "./qrBranded";

const TEXT_RGB: [number, number, number] = [17, 24, 39];
const MUTED_RGB: [number, number, number] = [75, 85, 99];

function lineHeightMm(pt: number) {
  return pt * 0.352778;
}

function sanitizePdfText(raw: string): string {
  let s = String(raw ?? "").normalize("NFC");
  try {
    s = s.replace(/\p{Extended_Pictographic}/gu, "");
  } catch {
    s = s.replace(/[\u231A-\u23FA\u2600-\u26FF\u2700-\u27BF\uFE0F]/g, "");
  }
  s = s.replace(/\uFE0F/g, "").replace(/\u200D/g, "");
  return s.replace(/\s+/g, " ").trim();
}

export type StaffQrPdfRow = {
  id: string;
  name: string;
  businessSlug?: string;
  employeeSlug?: string;
};

/** A4 staff bulk PDF: same structure as {@link qrPrintPdf} (no emoji, Helvetica, no “Powered by”). */
export async function downloadStaffQrPdf(
  items: StaffQrPdfRow[],
  fileBaseName: string,
  opts?: { businessLogoPngDataUrl?: string | null }
): Promise<void> {
  const withId = items.filter((i) => i.id?.trim());
  if (withId.length === 0) return;

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const cx = pageW / 2;
  const margin = 18;
  const contentW = pageW - margin * 2;
  const logo = opts?.businessLogoPngDataUrl?.trim();

  const headerInner = 2.8;
  const noLogoTopPad = 8;
  const afterHeaderGroup = 14;
  const afterQr = 5;
  const afterInstruction = 14;
  const bottomSafe = 10;
  const logoMm = 14;
  const primaryFont = 22;
  const instructionFont = 14;
  const thanksFont = 11;

  for (let i = 0; i < withId.length; i++) {
    if (i > 0) pdf.addPage();
    const row = withId[i];
    const primary = sanitizePdfText(row.name) || "Team member";

    let y = margin;

    if (logo) {
      try {
        const side = logoMm;
        pdf.addImage(logo, "PNG", (pageW - side) / 2, y, side, side);
        y += side + headerInner;
      } catch {
        y += noLogoTopPad;
      }
    } else {
      y += noLogoTopPad;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...TEXT_RGB);
    pdf.setFontSize(primaryFont);
    const titleLines = pdf.splitTextToSize(primary, contentW);
    const lhT = lineHeightMm(primaryFont);
    let titleB = y + lineHeightMm(primaryFont) * 0.88;
    for (let ti = 0; ti < titleLines.length; ti++) {
      pdf.text(titleLines[ti], cx, titleB, { align: "center" });
      if (ti < titleLines.length - 1) titleB += lhT + 0.55;
    }
    y = titleB + lhT * 0.22 + headerInner * 0.5;

    const headerGroupBottom = y;
    const qrBandTop = headerGroupBottom + afterHeaderGroup;

    const instruction = "Scan to tip instantly";
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(instructionFont);
    const instrLines = pdf.splitTextToSize(instruction, contentW);
    const nInstr = Math.max(1, instrLines.length);
    const lhI = lineHeightMm(instructionFont);
    const instrBodyH = lhI * nInstr + 0.55 * Math.max(0, nInstr - 1);
    const heightFromQrBottomToPastInstruction = afterQr + lhI * 0.88 + instrBodyH + lhI * 0.22;
    const lhThanks = lineHeightMm(thanksFont);
    const heightInstructionGapAndFooter =
      afterInstruction + lineHeightMm(thanksFont) * 0.88 + lhThanks + bottomSafe;
    const bottomReservedFromQr = heightFromQrBottomToPastInstruction + heightInstructionGapAndFooter;
    const qrBandBottom = pageH - margin - bottomReservedFromQr;
    const qrBandH = qrBandBottom - qrBandTop;

    const dataUrl =
      row.businessSlug && row.employeeSlug
        ? await renderBrandedQRToDataUrl(row.businessSlug, row.employeeSlug)
        : await renderBrandedQRToDataUrlLegacy(row.id);
    if (!dataUrl) continue;

    const qrMaxByWidth = contentW;
    const qrTarget = Math.min(qrMaxByWidth, pageH * 0.48, Math.max(56, qrBandH));
    const qrSize = Math.min(qrMaxByWidth, Math.max(56, Math.min(qrTarget, qrBandH)));
    const qrY = qrBandTop + Math.max(0, (qrBandH - qrSize) / 2);
    const qrX = (pageW - qrSize) / 2;
    pdf.addImage(dataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    const instructionTop = qrY + qrSize + afterQr;
    let instrB = instructionTop + lhI * 0.88;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...TEXT_RGB);
    pdf.setFontSize(instructionFont);
    for (let ii = 0; ii < instrLines.length; ii++) {
      pdf.text(instrLines[ii], cx, instrB, { align: "center" });
      if (ii < instrLines.length - 1) instrB += lhI + 0.55;
    }

    const footerBlockTop = instrB + lhI * 0.22 + afterInstruction;
    const thanksB = footerBlockTop + lhThanks * 0.88;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED_RGB);
    pdf.setFontSize(thanksFont);
    pdf.text("Thank you", cx, thanksB, { align: "center" });
  }

  pdf.save(`${fileBaseName}.pdf`);
}

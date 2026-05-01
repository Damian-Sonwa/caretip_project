import { jsPDF } from "jspdf";

const TEXT_RGB: [number, number, number] = [17, 24, 39]; // slate-900-ish
const MUTED_RGB: [number, number, number] = [75, 85, 99]; // slate-600-ish
const SOFT_LINE_RGB: [number, number, number] = [226, 232, 240]; // slate-200-ish

function safeFileBase(raw: string): string {
  const s = String(raw ?? "").trim();
  const base = s.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return base || "caretip_qr";
}

export type PdfSize = "a4" | "card";

function buildPdf(size: PdfSize) {
  if (size === "card") {
    // ~A6 portrait (105 x 148mm), good for small stands/cards.
    return new jsPDF({ unit: "mm", format: [105, 148], orientation: "portrait" });
  }
  return new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeOptionalText(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  return s ? s : null;
}

/**
 * Single canonical print layout for all QR PDFs.
 * Hierarchy (top → bottom): Header → optional Subtext → QR → Instruction → Footer → Branding.
 */
function renderStandardQrPdfLayout(params: {
  pdf: jsPDF;
  size: PdfSize;
  header: string;
  subtext?: string | null;
  qrPngDataUrl: string;
  instruction?: string | null;
}): void {
  const pdf = params.pdf;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const margin = params.size === "card" ? 10 : 18;
  const topY = margin;
  const bottomY = pageH - margin;

  const header = String(params.header ?? "").trim() || "Tip";
  const subtext = normalizeOptionalText(params.subtext);
  const instruction = String(params.instruction ?? "Scan to tip instantly").trim() || "Scan to tip instantly";
  const footerText = "Thank you 💖";
  const brandText = "Powered by CareTip Limited";

  const headerFont = params.size === "card" ? 18 : 26;
  const subFont = params.size === "card" ? 10 : 12;
  const instructionFont = params.size === "card" ? 12 : 16;
  const footerFont = params.size === "card" ? 12 : 14;
  const brandFont = params.size === "card" ? 8.5 : 9.5;

  // Header
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(headerFont);
  const headerBaseline = topY + (params.size === "card" ? 10 : 14);
  pdf.text(header, pageW / 2, headerBaseline, { align: "center" });

  // Divider under header block
  pdf.setDrawColor(...SOFT_LINE_RGB);
  const dividerY = topY + (params.size === "card" ? 18 : 24);
  pdf.setLineWidth(0.35);
  pdf.line(margin, dividerY, pageW - margin, dividerY);

  let contentY = dividerY + (params.size === "card" ? 10 : 14);

  // Subtext (optional)
  if (subtext) {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED_RGB);
    pdf.setFontSize(subFont);
    pdf.text(subtext, pageW / 2, contentY, { align: "center" });
    contentY += params.size === "card" ? 9 : 11;
  }

  // Reserve bottom area for instruction + footer + branding (fixed hierarchy)
  const gapAfterQr = params.size === "card" ? 9 : 12;
  const gapFooterToBrand = params.size === "card" ? 8 : 10;
  const gapBrandToBottom = params.size === "card" ? 6 : 8;

  const instructionLineH = instructionFont * 0.45;
  const footerLineH = footerFont * 0.45;
  const brandLineH = brandFont * 0.45;

  const bottomBlockH =
    gapAfterQr +
    instructionLineH +
    (params.size === "card" ? 10 : 12) + // gap before footer
    footerLineH +
    gapFooterToBrand +
    brandLineH +
    gapBrandToBottom;

  const availableTop = contentY;
  const middleTop = availableTop;
  const middleBottom = bottomY - bottomBlockH;
  const middleH = Math.max(0, middleBottom - middleTop);
  if (middleH < 18) {
    // Extremely tight page; degrade gracefully rather than throwing layout errors.
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED_RGB);
    pdf.setFontSize(10);
    pdf.text("Not enough space to render this QR layout. Try A4 or reduce text length.", pageW / 2, middleTop + 8, {
      align: "center",
    });
    return;
  }

  const qrMaxByWidth = pageW - margin * 2;
  const qrTargetByHeight = pageH * (params.size === "card" ? 0.44 : 0.48);
  const desiredQr = Math.min(qrMaxByWidth, qrTargetByHeight, middleH);
  const minQr = params.size === "card" ? 36 : 56;
  const qrSize = clamp(desiredQr, Math.min(minQr, middleH), qrMaxByWidth);

  // Vertically center QR within the remaining middle band (never overlap the fixed bottom stack)
  const qrY = middleTop + Math.max(0, (middleH - qrSize) / 2);
  const qrX = (pageW - qrSize) / 2;

  pdf.addImage(params.qrPngDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Instruction
  const instructionY = qrY + qrSize + gapAfterQr;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(instructionFont);
  pdf.text(instruction, pageW / 2, instructionY, { align: "center" });

  // Footer
  const footerY = instructionY + (params.size === "card" ? 10 : 12);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED_RGB);
  pdf.setFontSize(footerFont);
  pdf.text(footerText, pageW / 2, footerY, { align: "center" });

  // Bottom branding (separated)
  const brandY = footerY + gapFooterToBrand;
  pdf.setDrawColor(...SOFT_LINE_RGB);
  pdf.setLineWidth(0.25);
  pdf.line(margin + 18, brandY - 4, pageW - margin - 18, brandY - 4);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED_RGB);
  pdf.setFontSize(brandFont);
  pdf.text(brandText, pageW / 2, brandY, { align: "center" });
}

export function createBusinessQrPrintPdf(params: {
  qrPngDataUrl: string;
  businessName: string;
  /** Business location or registered address (plain text). */
  subtext?: string | null;
  instruction?: string | null;
  size?: PdfSize;
}): jsPDF {
  const pdf = buildPdf(params.size ?? "a4");
  const businessName = String(params.businessName ?? "").trim() || "Business";
  renderStandardQrPdfLayout({
    pdf,
    size: params.size ?? "a4",
    header: `Tip ${businessName}`,
    subtext: normalizeOptionalText(params.subtext),
    qrPngDataUrl: params.qrPngDataUrl,
    instruction: params.instruction,
  });
  return pdf;
}

export async function downloadBusinessQrPrintPdf(params: {
  qrPngDataUrl: string;
  businessName: string;
  subtext?: string | null;
  instruction?: string | null;
  fileBaseName?: string;
  size?: PdfSize;
}): Promise<void> {
  const pdf = createBusinessQrPrintPdf(params);
  const base = safeFileBase(params.fileBaseName ?? `CareTip_QR_${String(params.businessName ?? "").trim() || "Business"}`);
  pdf.save(`${base}.pdf`);
}

export function createEmployeeQrPrintPdf(params: {
  qrPngDataUrl: string;
  employeeName: string;
  businessName: string;
  instruction?: string | null;
  size?: PdfSize;
}): jsPDF {
  const pdf = buildPdf(params.size ?? "a4");
  const employeeName = String(params.employeeName ?? "").trim() || "Team member";
  const businessName = String(params.businessName ?? "").trim() || "Business";
  renderStandardQrPdfLayout({
    pdf,
    size: params.size ?? "a4",
    header: `Tip ${employeeName}`,
    subtext: businessName,
    qrPngDataUrl: params.qrPngDataUrl,
    instruction: params.instruction,
  });
  return pdf;
}

export async function downloadEmployeeQrPrintPdf(params: {
  qrPngDataUrl: string;
  employeeName: string;
  businessName: string;
  instruction?: string | null;
  fileBaseName?: string;
  size?: PdfSize;
}): Promise<void> {
  const pdf = createEmployeeQrPrintPdf(params);
  const base = safeFileBase(params.fileBaseName ?? `CareTip_QR_${String(params.employeeName ?? "").trim() || "Team_member"}`);
  pdf.save(`${base}.pdf`);
}

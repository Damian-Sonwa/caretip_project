import { jsPDF } from "jspdf";

const TEXT_RGB: [number, number, number] = [17, 24, 39]; // slate-900-ish
const MUTED_RGB: [number, number, number] = [75, 85, 99]; // slate-600-ish
const SOFT_LINE_RGB: [number, number, number] = [226, 232, 240]; // slate-200-ish

function safeFileBase(raw: string): string {
  const s = String(raw ?? "").trim();
  const base = s.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return base || "caretip_qr";
}

type PdfSize = "a4" | "card";

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

function drawPinIcon(pdf: jsPDF, x: number, y: number, sizeMm: number, rgb: [number, number, number]) {
  // Simple location pin made from a circle and a point.
  const r = sizeMm * 0.28;
  const cx = x + sizeMm / 2;
  const cy = y + sizeMm * 0.38;
  pdf.setDrawColor(...rgb);
  pdf.setFillColor(...rgb);
  pdf.circle(cx, cy, r, "F");
  // Point
  pdf.triangle(cx, y + sizeMm * 0.98, x + sizeMm * 0.28, y + sizeMm * 0.55, x + sizeMm * 0.72, y + sizeMm * 0.55, "F");
  // Inner hole
  pdf.setFillColor(255, 255, 255);
  pdf.circle(cx, cy, r * 0.42, "F");
}

function drawHeart(pdf: jsPDF, x: number, y: number, sizeMm: number, rgb: [number, number, number]) {
  // Minimal heart: two circles + triangle.
  const r = sizeMm * 0.22;
  pdf.setDrawColor(...rgb);
  pdf.setFillColor(...rgb);
  pdf.circle(x + r, y + r, r, "F");
  pdf.circle(x + r * 3, y + r, r, "F");
  pdf.triangle(x + r * 0.3, y + r * 1.3, x + r * 3.7, y + r * 1.3, x + r * 2, y + r * 3.9, "F");
}

function textWidth(pdf: jsPDF, text: string) {
  return pdf.getTextWidth(text);
}

export function createBusinessQrPrintPdf(params: {
  qrPngDataUrl: string;
  businessName: string;
  contextLine?: string | null;
  location?: string | null;
  instruction?: string;
  size?: PdfSize;
}): jsPDF {
  const pdf = buildPdf(params.size ?? "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const businessName = String(params.businessName ?? "").trim() || "Business";
  const contextLine = String(params.contextLine ?? "").trim();
  const location = String(params.location ?? "").trim();
  const instruction = String(params.instruction ?? "Scan to tip instantly").trim() || "Scan to tip instantly";

  const margin = params.size === "card" ? 10 : 18;
  const topY = margin;
  const bottomY = pageH - margin;

  // Header
  const headerText = `Tip ${businessName}`;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(params.size === "card" ? 18 : 26);
  pdf.text(headerText, pageW / 2, topY + (params.size === "card" ? 10 : 14), { align: "center" });

  // Divider (subtle)
  pdf.setDrawColor(...SOFT_LINE_RGB);
  const dividerY = topY + (params.size === "card" ? 18 : 24);
  pdf.setLineWidth(0.35);
  pdf.line(margin, dividerY, pageW - margin, dividerY);

  // Location line with pin icon (centered as a group)
  let contentY = dividerY + (params.size === "card" ? 10 : 14);

  // Context line (e.g., Table name or Location name)
  if (contextLine) {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED_RGB);
    pdf.setFontSize(params.size === "card" ? 10 : 12);
    pdf.text(contextLine, pageW / 2, contentY, { align: "center" });
    contentY += params.size === "card" ? 9 : 11;
  }

  if (location) {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED_RGB);
    pdf.setFontSize(params.size === "card" ? 10 : 12);

    const iconSize = params.size === "card" ? 5.2 : 6.2;
    const gap = 2.2;
    const locW = textWidth(pdf, location);
    const groupW = iconSize + gap + locW;
    const startX = (pageW - groupW) / 2;
    drawPinIcon(pdf, startX, contentY - iconSize * 0.75, iconSize, MUTED_RGB);
    pdf.text(location, startX + iconSize + gap, contentY, { align: "left" });

    contentY += params.size === "card" ? 10 : 12;
  }

  // QR (dominant element, 40–50% of page height)
  const qrMaxByWidth = pageW - margin * 2;
  const qrTargetByHeight = pageH * (params.size === "card" ? 0.44 : 0.48);
  const qrSize = clamp(
    Math.min(qrMaxByWidth, qrTargetByHeight),
    params.size === "card" ? 62 : 110,
    qrMaxByWidth
  );

  // Compute remaining space and center the QR+text block vertically.
  const instructionFontSize = params.size === "card" ? 12 : 16;
  const footerFontSize = params.size === "card" ? 12 : 14;
  const blockGap1 = params.size === "card" ? 9 : 12;
  const blockGap2 = params.size === "card" ? 10 : 14;

  const blockH =
    qrSize +
    blockGap1 + // instruction gap
    instructionFontSize * 0.45 +
    blockGap2 + // footer gap
    footerFontSize * 0.45;

  const availableTop = contentY;
  const availableH = bottomY - availableTop;
  const blockTop = availableTop + Math.max(0, (availableH - blockH) / 2);

  const qrX = (pageW - qrSize) / 2;
  const qrY = blockTop;
  pdf.addImage(params.qrPngDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Instruction
  const instructionY = qrY + qrSize + blockGap1;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(instructionFontSize);
  pdf.text(instruction, pageW / 2, instructionY, { align: "center" });

  // Footer
  const footerY = instructionY + blockGap2;
  const footerText = "Thank you";
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED_RGB);
  pdf.setFontSize(footerFontSize);
  const footerW = textWidth(pdf, footerText);
  const heartSize = params.size === "card" ? 6 : 7;
  const footerGap = 2.5;
  const footerGroupW = footerW + footerGap + heartSize;
  const footerStartX = (pageW - footerGroupW) / 2;
  pdf.text(footerText, footerStartX, footerY, { align: "left" });
  drawHeart(pdf, footerStartX + footerW + footerGap, footerY - heartSize * 0.75, heartSize, [239, 68, 68]); // red-500-ish

  return pdf;
}

export async function downloadBusinessQrPrintPdf(params: {
  qrPngDataUrl: string;
  businessName: string;
  contextLine?: string | null;
  location?: string | null;
  instruction?: string;
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
  instruction?: string;
  size?: PdfSize;
}): jsPDF {
  const pdf = buildPdf(params.size ?? "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const employeeName = String(params.employeeName ?? "").trim() || "Team member";
  const businessName = String(params.businessName ?? "").trim() || "Business";
  const instruction = String(params.instruction ?? "Scan to tip instantly").trim() || "Scan to tip instantly";

  const margin = params.size === "card" ? 10 : 18;
  const topY = margin;
  const bottomY = pageH - margin;

  // Header
  const headerText = `Tip ${employeeName}`;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(params.size === "card" ? 18 : 26);
  pdf.text(headerText, pageW / 2, topY + (params.size === "card" ? 10 : 14), { align: "center" });

  // Divider
  pdf.setDrawColor(...SOFT_LINE_RGB);
  const dividerY = topY + (params.size === "card" ? 18 : 24);
  pdf.setLineWidth(0.35);
  pdf.line(margin, dividerY, pageW - margin, dividerY);

  // Subtext: business name
  let contentY = dividerY + (params.size === "card" ? 10 : 14);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED_RGB);
  pdf.setFontSize(params.size === "card" ? 10 : 12);
  pdf.text(businessName, pageW / 2, contentY, { align: "center" });
  contentY += params.size === "card" ? 10 : 12;

  // QR (dominant)
  const qrMaxByWidth = pageW - margin * 2;
  const qrTargetByHeight = pageH * (params.size === "card" ? 0.44 : 0.48);
  const qrSize = clamp(
    Math.min(qrMaxByWidth, qrTargetByHeight),
    params.size === "card" ? 62 : 110,
    qrMaxByWidth
  );

  const instructionFontSize = params.size === "card" ? 12 : 16;
  const footerFontSize = params.size === "card" ? 12 : 14;
  const blockGap1 = params.size === "card" ? 9 : 12;
  const blockGap2 = params.size === "card" ? 10 : 14;

  const blockH =
    qrSize +
    blockGap1 +
    instructionFontSize * 0.45 +
    blockGap2 +
    footerFontSize * 0.45;

  const availableTop = contentY;
  const availableH = bottomY - availableTop;
  const blockTop = availableTop + Math.max(0, (availableH - blockH) / 2);

  const qrX = (pageW - qrSize) / 2;
  const qrY = blockTop;
  pdf.addImage(params.qrPngDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  const instructionY = qrY + qrSize + blockGap1;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(instructionFontSize);
  pdf.text(instruction, pageW / 2, instructionY, { align: "center" });

  const footerY = instructionY + blockGap2;
  const footerText = "Thank you";
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED_RGB);
  pdf.setFontSize(footerFontSize);
  const footerW = textWidth(pdf, footerText);
  const heartSize = params.size === "card" ? 6 : 7;
  const footerGap = 2.5;
  const footerGroupW = footerW + footerGap + heartSize;
  const footerStartX = (pageW - footerGroupW) / 2;
  pdf.text(footerText, footerStartX, footerY, { align: "left" });
  drawHeart(pdf, footerStartX + footerW + footerGap, footerY - heartSize * 0.75, heartSize, [239, 68, 68]);

  return pdf;
}

export async function downloadEmployeeQrPrintPdf(params: {
  qrPngDataUrl: string;
  employeeName: string;
  businessName: string;
  instruction?: string;
  fileBaseName?: string;
  size?: PdfSize;
}): Promise<void> {
  const pdf = createEmployeeQrPrintPdf(params);
  const base = safeFileBase(params.fileBaseName ?? `CareTip_QR_${String(params.employeeName ?? "").trim() || "Team_member"}`);
  pdf.save(`${base}.pdf`);
}


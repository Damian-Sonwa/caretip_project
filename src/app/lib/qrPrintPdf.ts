import { createJsPdfDocument, type JsPDFDocument } from "./qrPdfLazy";

const TEXT_RGB: [number, number, number] = [17, 24, 39];
const MUTED_RGB: [number, number, number] = [75, 85, 99];

/** Vertical rhythm: tight inside header group, larger before QR and before footer. */
const LAYOUT = {
  a4: {
    margin: 18,
    headerInner: 2.8,
    noLogoTopPad: 8,
    afterHeaderGroup: 14,
    afterQr: 5,
    afterInstruction: 14,
    bottomSafe: 10,
    logoMm: 15,
    primaryFont: 24,
    secondaryFont: 11,
    instructionFont: 15,
    thanksFont: 11,
    qrMaxHeightFrac: 0.5,
    qrMinMm: 58,
  },
  card: {
    margin: 10,
    headerInner: 2,
    noLogoTopPad: 5,
    afterHeaderGroup: 9,
    afterQr: 3.8,
    afterInstruction: 10,
    bottomSafe: 7,
    logoMm: 10.5,
    primaryFont: 16,
    secondaryFont: 9,
    instructionFont: 12,
    thanksFont: 9,
    qrMaxHeightFrac: 0.46,
    qrMinMm: 38,
  },
} as const;

/**
 * Strip characters that corrupt with jsPDF built-in fonts (Helvetica / WinAnsi).
 * Removes emoji; keeps typical Latin text. No emoji in PDF output.
 */
function sanitizePdfText(raw: string): string {
  let s = String(raw ?? "").normalize("NFC");
  try {
    s = s.replace(/\p{Extended_Pictographic}/gu, "");
  } catch {
    // Legacy fallback when `\p{Extended_Pictographic}` is unavailable (eslint: combined chars in class).
    // eslint-disable-next-line no-misleading-character-class -- intentional emoji strip ranges
    s = s.replace(/[\u231A-\u23FA\u2600-\u26FF\u2700-\u27BF\uFE0F]/g, "");
  }
  s = s.replace(/\uFE0F/g, "").replace(/\u200D/g, "");
  return s.replace(/\s+/g, " ").trim();
}

function safeFileBase(raw: string): string {
  const s = String(raw ?? "").trim();
  const base = s.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return base || "caretip_qr";
}

export type PdfSize = "a4" | "card";

async function buildPdf(size: PdfSize): Promise<JsPDFDocument> {
  if (size === "card") {
    return createJsPdfDocument({ unit: "mm", format: [105, 148], orientation: "portrait" });
  }
  return createJsPdfDocument({ unit: "mm", format: "a4", orientation: "portrait" });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeOptionalText(raw: string | null | undefined): string | null {
  const s = sanitizePdfText(String(raw ?? ""));
  return s ? s : null;
}

function lineHeightMm(fontSizePt: number) {
  return fontSizePt * 0.352778;
}

function firstBaselineFromTop(blockTopMm: number, fontSizePt: number) {
  return blockTopMm + lineHeightMm(fontSizePt) * 0.88;
}

/**
 * Shared print layout (business, employee, venue/table/location via same API):
 * Logo → primary name → optional secondary line → QR → instruction → Thank you.
 * Helvetica only; user strings sanitized (no emoji).
 */
function renderStandardQrPdfLayout(params: {
  pdf: JsPDFDocument;
  size: PdfSize;
  primaryName: string;
  secondaryLine?: string | null;
  qrPngDataUrl: string;
  instruction?: string | null;
  businessLogoPngDataUrl?: string | null;
}): void {
  const pdf = params.pdf;
  const L = params.size === "card" ? LAYOUT.card : LAYOUT.a4;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const cx = pageW / 2;

  const margin = L.margin;
  const contentW = pageW - margin * 2;

  const primary = sanitizePdfText(params.primaryName) || "Business";
  const secondary = normalizeOptionalText(params.secondaryLine);
  const instruction =
    sanitizePdfText(String(params.instruction ?? "Scan to tip instantly").trim()) || "Scan to tip instantly";
  const footerThanks = "Thank you";

  const logoRaw = params.businessLogoPngDataUrl?.trim();
  const hasLogo = Boolean(logoRaw);

  pdf.setFont("helvetica", "normal");

  // --- 1) Header group: logo → business name → location / secondary ---
  let y = margin;

  if (hasLogo && logoRaw) {
    const side = L.logoMm;
    const logoX = (pageW - side) / 2;
    try {
      pdf.addImage(logoRaw, "PNG", logoX, y, side, side);
    } catch {
      // ignore bad image
    }
    y += side + L.headerInner;
  } else {
    y += L.noLogoTopPad;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(L.primaryFont);
  const primaryLines = pdf.splitTextToSize(primary, contentW);
  const lhPrimary = lineHeightMm(L.primaryFont);
  let primaryB = firstBaselineFromTop(y, L.primaryFont);
  for (let pi = 0; pi < primaryLines.length; pi++) {
    pdf.text(primaryLines[pi], cx, primaryB, { align: "center" });
    if (pi < primaryLines.length - 1) primaryB += lhPrimary + 0.55;
  }
  y = primaryB + lhPrimary * 0.22 + L.headerInner;

  if (secondary) {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED_RGB);
    pdf.setFontSize(L.secondaryFont);
    const secLines = pdf.splitTextToSize(secondary, contentW);
    const lhSec = lineHeightMm(L.secondaryFont);
    let secB = firstBaselineFromTop(y, L.secondaryFont);
    for (let si = 0; si < secLines.length; si++) {
      pdf.text(secLines[si], cx, secB, { align: "center" });
      if (si < secLines.length - 1) secB += lhSec + 0.45;
    }
    y = secB + lhSec * 0.22 + L.headerInner * 0.35;
  }

  const headerGroupBottom = y;
  const qrBandTop = headerGroupBottom + L.afterHeaderGroup;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(L.instructionFont);
  const instrLines = pdf.splitTextToSize(instruction, contentW);
  const instrLineCount = Math.max(1, instrLines.length);
  const lhInstr = lineHeightMm(L.instructionFont);
  const instrBodyH = lhInstr * instrLineCount + 0.55 * Math.max(0, instrLineCount - 1);
  const heightFromQrBottomToPastInstruction =
    L.afterQr + lineHeightMm(L.instructionFont) * 0.88 + instrBodyH + lhInstr * 0.22;

  const lhThanks = lineHeightMm(L.thanksFont);
  const heightInstructionGapAndFooter =
    L.afterInstruction + lineHeightMm(L.thanksFont) * 0.88 + lhThanks + L.bottomSafe;

  const bottomReservedFromQr = heightFromQrBottomToPastInstruction + heightInstructionGapAndFooter;
  const qrBandBottom = pageH - margin - bottomReservedFromQr;
  const qrBandH = qrBandBottom - qrBandTop;

  if (qrBandH < L.qrMinMm * 0.35) {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED_RGB);
    pdf.setFontSize(10);
    pdf.text("Not enough space for this QR layout. Try A4 or shorten text.", cx, qrBandTop + 8, {
      align: "center",
    });
    return;
  }

  const qrMaxByWidth = contentW;
  const qrTargetByHeight = pageH * L.qrMaxHeightFrac;
  const desiredQr = Math.min(qrMaxByWidth, qrTargetByHeight, qrBandH);
  const qrSize = clamp(desiredQr, Math.min(L.qrMinMm, qrBandH), qrMaxByWidth);
  const qrY = qrBandTop + Math.max(0, (qrBandH - qrSize) / 2);
  const qrX = (pageW - qrSize) / 2;

  pdf.addImage(params.qrPngDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  const instructionTop = qrY + qrSize + L.afterQr;
  let instrB = firstBaselineFromTop(instructionTop, L.instructionFont);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(L.instructionFont);
  for (let ii = 0; ii < instrLines.length; ii++) {
    pdf.text(instrLines[ii], cx, instrB, { align: "center" });
    if (ii < instrLines.length - 1) instrB += lhInstr + 0.55;
  }

  const footerBlockTop = instrB + lhInstr * 0.22 + L.afterInstruction;
  const thanksBaseline = footerBlockTop + lhThanks * 0.88;

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED_RGB);
  pdf.setFontSize(L.thanksFont);
  pdf.text(footerThanks, cx, thanksBaseline, { align: "center" });
}

export async function createBusinessQrPrintPdf(params: {
  qrPngDataUrl: string;
  businessName: string;
  subtext?: string | null;
  instruction?: string | null;
  size?: PdfSize;
  businessLogoPngDataUrl?: string | null;
}): Promise<JsPDFDocument> {
  const pdf = await buildPdf(params.size ?? "a4");
  const businessName = sanitizePdfText(String(params.businessName ?? "").trim()) || "Business";
  renderStandardQrPdfLayout({
    pdf,
    size: params.size ?? "a4",
    primaryName: businessName,
    secondaryLine: normalizeOptionalText(params.subtext),
    qrPngDataUrl: params.qrPngDataUrl,
    instruction: params.instruction,
    businessLogoPngDataUrl: params.businessLogoPngDataUrl,
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
  businessLogoPngDataUrl?: string | null;
}): Promise<void> {
  const pdf = await createBusinessQrPrintPdf(params);
  const base = safeFileBase(params.fileBaseName ?? `CareTip_QR_${String(params.businessName ?? "").trim() || "Business"}`);
  pdf.save(`${base}.pdf`);
}

export async function createEmployeeQrPrintPdf(params: {
  qrPngDataUrl: string;
  employeeName: string;
  businessName: string;
  instruction?: string | null;
  size?: PdfSize;
  businessLogoPngDataUrl?: string | null;
}): Promise<JsPDFDocument> {
  const pdf = await buildPdf(params.size ?? "a4");
  const employeeName = sanitizePdfText(String(params.employeeName ?? "").trim()) || "Team member";
  const businessName = sanitizePdfText(String(params.businessName ?? "").trim()) || "Business";
  renderStandardQrPdfLayout({
    pdf,
    size: params.size ?? "a4",
    primaryName: employeeName,
    secondaryLine: businessName,
    qrPngDataUrl: params.qrPngDataUrl,
    instruction: params.instruction,
    businessLogoPngDataUrl: params.businessLogoPngDataUrl,
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
  businessLogoPngDataUrl?: string | null;
}): Promise<void> {
  const pdf = await createEmployeeQrPrintPdf(params);
  const base = safeFileBase(params.fileBaseName ?? `CareTip_QR_${String(params.employeeName ?? "").trim() || "Team_member"}`);
  pdf.save(`${base}.pdf`);
}

import { jsPDF } from "jspdf";

const TEXT_RGB: [number, number, number] = [17, 24, 39]; // slate-900-ish
const MUTED_RGB: [number, number, number] = [75, 85, 99]; // slate-600-ish

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

export async function downloadBusinessQrPrintPdf(params: {
  qrPngDataUrl: string;
  businessName: string;
  location?: string | null;
  instruction?: string;
  fileBaseName?: string;
  size?: PdfSize;
}): Promise<void> {
  const pdf = buildPdf(params.size ?? "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const businessName = String(params.businessName ?? "").trim() || "Business";
  const location = String(params.location ?? "").trim();
  const instruction = String(params.instruction ?? "Scan to tip instantly").trim();

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(18);
  pdf.text(businessName, pageW / 2, 26, { align: "center" });

  if (location) {
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED_RGB);
    pdf.setFontSize(11);
    pdf.text(location, pageW / 2, 34, { align: "center" });
  }

  const qrSize = Math.min(92, pageW - 40);
  const qrX = (pageW - qrSize) / 2;
  const qrY = 44;
  pdf.addImage(params.qrPngDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  const afterQrY = qrY + qrSize + 16;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(14);
  pdf.text(instruction, pageW / 2, Math.min(afterQrY, pageH - 26), { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED_RGB);
  pdf.setFontSize(10);
  pdf.text("CareTip", pageW / 2, pageH - 16, { align: "center" });

  const base = safeFileBase(params.fileBaseName ?? `CareTip_QR_${businessName}`);
  pdf.save(`${base}.pdf`);
}

export async function downloadEmployeeQrPrintPdf(params: {
  qrPngDataUrl: string;
  employeeName: string;
  businessName: string;
  instruction?: string;
  fileBaseName?: string;
  size?: PdfSize;
}): Promise<void> {
  const pdf = buildPdf(params.size ?? "a4");
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const employeeName = String(params.employeeName ?? "").trim() || "Team member";
  const businessName = String(params.businessName ?? "").trim() || "Business";
  const instruction = String(params.instruction ?? "Scan to tip").trim();

  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(18);
  pdf.text(employeeName, pageW / 2, 26, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED_RGB);
  pdf.setFontSize(11);
  pdf.text(businessName, pageW / 2, 34, { align: "center" });

  const qrSize = Math.min(92, pageW - 40);
  const qrX = (pageW - qrSize) / 2;
  const qrY = 44;
  pdf.addImage(params.qrPngDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  const afterQrY = qrY + qrSize + 16;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...TEXT_RGB);
  pdf.setFontSize(14);
  pdf.text(instruction, pageW / 2, Math.min(afterQrY, pageH - 26), { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...MUTED_RGB);
  pdf.setFontSize(10);
  pdf.text("CareTip", pageW / 2, pageH - 16, { align: "center" });

  const base = safeFileBase(params.fileBaseName ?? `CareTip_QR_${employeeName}`);
  pdf.save(`${base}.pdf`);
}


import type { jsPDF } from "jspdf";

export type JsPDFDocument = jsPDF;

type JsPdfCtorOptions = {
  orientation?: "portrait" | "landscape" | "p" | "l";
  unit?: "pt" | "px" | "in" | "mm" | "cm" | "ex" | "em" | "pc";
  format?: string | number[];
  compress?: boolean;
};

export async function createJsPdfDocument(options?: JsPdfCtorOptions): Promise<JsPDFDocument> {
  const { jsPDF } = await import("jspdf");
  return new jsPDF(options);
}

/** Magic-byte validation for KYC / verification documents (PDF + JPEG/PNG/WebP only). */

export const VERIFICATION_MAX_BYTES = 10 * 1024 * 1024;

export type VerificationFileKind = "pdf" | "jpeg" | "png" | "webp";

export type ValidatedVerificationDocument = {
  kind: VerificationFileKind;
  contentType: string;
  extension: string;
};

const PDF_HEADER = "%PDF-";

export function isSvgMimetype(mimetype: string): boolean {
  return /svg/i.test(mimetype.trim());
}

export function isSvgContent(buffer: Buffer): boolean {
  if (!buffer?.length) return false;
  const head = buffer.subarray(0, Math.min(buffer.length, 256)).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<svg") || head.includes("<svg")) return true;
  if (head.startsWith("<?xml") && head.includes("<svg")) return true;
  return false;
}

/** Reject embedded executable / script markers (polyglot hardening). */
export function assertNoForbiddenEmbeddedPayload(buffer: Buffer, opts?: { pdf?: boolean }): void {
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    throw new Error("Unsupported file content.");
  }
  if (opts?.pdf) {
    return;
  }

  const head = buffer.subarray(0, Math.min(buffer.length, 512)).toString("utf8").toLowerCase();
  if (head.includes("<script") || head.includes("<?php") || head.includes("<svg")) {
    throw new Error("Unsupported file content.");
  }

  if (buffer.length > 512) {
    const tail = buffer.subarray(Math.max(0, buffer.length - 2048)).toString("binary").toLowerCase();
    if (tail.includes("<?php") || tail.includes("<script")) {
      throw new Error("Unsupported file content.");
    }
  }
}

export function sniffVerificationImageKind(buffer: Buffer): VerificationFileKind | null {
  if (buffer.length < 12) return null;
  const b0 = buffer[0]!;
  const b1 = buffer[1]!;
  const b2 = buffer[2]!;
  const b3 = buffer[3]!;

  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) return "jpeg";
  if (b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47) return "png";
  if (b0 === 0x52 && b1 === 0x49 && b2 === 0x46 && b3 === 0x46 && buffer.length >= 12) {
    const webp = buffer.subarray(8, 12).toString("ascii");
    if (webp === "WEBP") return "webp";
  }
  return null;
}

export function extensionForVerificationKind(kind: VerificationFileKind): string {
  switch (kind) {
    case "pdf":
      return ".pdf";
    case "jpeg":
      return ".jpg";
    case "png":
      return ".png";
    case "webp":
      return ".webp";
  }
}

export function contentTypeForVerificationKind(kind: VerificationFileKind): string {
  switch (kind) {
    case "pdf":
      return "application/pdf";
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
  }
}

/**
 * Validates verification/KYC uploads by file content only.
 * Client-supplied MIME types must not be trusted.
 */
export function validateVerificationDocumentBuffer(buffer: Buffer): ValidatedVerificationDocument {
  if (!buffer?.length) {
    throw new Error("File is empty.");
  }
  if (buffer.length > VERIFICATION_MAX_BYTES) {
    throw new Error("File is too large (max 10 MB).");
  }
  if (isSvgContent(buffer)) {
    throw new Error("SVG uploads are not allowed.");
  }

  const isPdf = buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === PDF_HEADER;
  assertNoForbiddenEmbeddedPayload(buffer, { pdf: isPdf });

  if (isPdf) {
    return {
      kind: "pdf",
      contentType: contentTypeForVerificationKind("pdf"),
      extension: extensionForVerificationKind("pdf"),
    };
  }

  const imageKind = sniffVerificationImageKind(buffer);
  if (!imageKind) {
    throw new Error("Unsupported verification file. Use PDF, JPEG, PNG, or WebP.");
  }

  return {
    kind: imageKind,
    contentType: contentTypeForVerificationKind(imageKind),
    extension: extensionForVerificationKind(imageKind),
  };
}

/** Multer first gate — still requires service-layer magic-byte validation. */
export function isVerificationMulterMimetype(mimetype: string): boolean {
  if (isSvgMimetype(mimetype)) return false;
  const mt = mimetype.trim().toLowerCase();
  return (
    mt === "application/pdf" ||
    mt === "image/jpeg" ||
    mt === "image/jpg" ||
    mt === "image/png" ||
    mt === "image/webp"
  );
}

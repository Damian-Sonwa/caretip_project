import { randomUUID } from "node:crypto";
import { isAllowedImageMimetype, isSvgMimetype } from "./imageUploadValidation.js";
import { isVerificationMulterMimetype } from "./verificationUploadValidation.js";

export function multerRejectMessage(err: Error): Error {
  return err;
}

export function assertMulterMimetypeAllowedForLogo(mimetype: string): void {
  if (isSvgMimetype(mimetype)) {
    throw new Error("SVG uploads are not allowed.");
  }
  if (!isAllowedImageMimetype(mimetype)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, GIF, WebP, HEIC, or AVIF.");
  }
}

export function assertMulterMimetypeAllowedForVerification(mimetype: string): void {
  if (isSvgMimetype(mimetype)) {
    throw new Error("SVG uploads are not allowed.");
  }
  if (!isVerificationMulterMimetype(mimetype)) {
    throw new Error("Allowed verification files: PDF, JPEG, PNG, or WebP.");
  }
}

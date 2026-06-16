/** Client-side checks before sending images to the API (must stay aligned with backend limits). */

export const CLIENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED = /^image\/(jpeg|jpg|png|gif|webp|heic|heif|avif)$/i;

export function validateImageFileForUpload(file: File): { ok: true } | { ok: false; message: string } {
  if (!file || file.size === 0) {
    return { ok: false, message: "Image file is empty." };
  }
  if (file.size > CLIENT_IMAGE_MAX_BYTES) {
    return { ok: false, message: "Image is too large (max 5 MB)." };
  }
  const t = file.type?.trim() ?? "";
  if (/svg/i.test(t)) {
    return { ok: false, message: "SVG uploads are not allowed." };
  }
  if (!ALLOWED.test(t)) {
    return {
      ok: false,
      message: "Unsupported image type. Use JPEG, PNG, GIF, WebP, HEIC, or AVIF.",
    };
  }
  return { ok: true };
}

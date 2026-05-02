/**
 * Loads an image URL (same-origin or CORS-enabled) into a square PNG data URL for PDF / canvas use.
 * Letterboxes on white so aspect ratio is preserved without distortion.
 */
export async function fetchImageUrlAsSquarePngDataUrl(
  absoluteUrl: string,
  sizePx = 512
): Promise<string | null> {
  const url = String(absoluteUrl ?? "").trim();
  if (!url) return null;
  try {
    const res = await fetch(url, { credentials: "include", mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    const bmp = await createImageBitmap(blob).catch(() => null);
    if (!bmp) return null;
    const canvas = document.createElement("canvas");
    canvas.width = sizePx;
    canvas.height = sizePx;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bmp.close?.();
      return null;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sizePx, sizePx);
    const scale = Math.min(sizePx / bmp.width, sizePx / bmp.height);
    const dw = bmp.width * scale;
    const dh = bmp.height * scale;
    ctx.drawImage(bmp, (sizePx - dw) / 2, (sizePx - dh) / 2, dw, dh);
    bmp.close?.();
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

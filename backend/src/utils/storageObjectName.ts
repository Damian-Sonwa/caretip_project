import path from "node:path";

/**
 * Unique, URL-safe object key for Supabase Storage: `Date.now()` + sanitized original base name + extension.
 * Avoids overwrites when multiple users upload files with the same name.
 */
export function buildUniqueStorageObjectName(originalFilename: string | undefined, extensionFallback = ".bin"): string {
  const raw = (originalFilename ?? "upload").trim() || "upload";
  let ext = path.extname(raw);
  if (!ext) {
    ext = extensionFallback.startsWith(".") ? extensionFallback : `.${extensionFallback}`;
  }
  const base =
    path
      .basename(raw, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 80) || "file";
  return `${Date.now()}-${base}${ext.toLowerCase()}`;
}

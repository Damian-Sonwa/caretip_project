import { randomUUID } from "node:crypto";

/**
 * Unique object filename using only a content-derived extension (ignores user filenames).
 */
export function buildUniqueStorageObjectNameFromExtension(extension: string): string {
  let ext = extension.trim().toLowerCase();
  if (!ext.startsWith(".")) ext = `.${ext}`;
  if (!/^\.[a-z0-9]{1,8}$/.test(ext)) {
    ext = ".bin";
  }
  return `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
}

/** @deprecated Use buildUniqueStorageObjectNameFromExtension — user filenames are not trusted. */
export function buildUniqueStorageObjectName(originalFilename: string | undefined, extensionFallback = ".bin"): string {
  return buildUniqueStorageObjectNameFromExtension(extensionFallback);
}

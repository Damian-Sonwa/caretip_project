import { mkdirSync, writeFileSync } from "fs";
import path from "node:path";
import { randomUUID } from "crypto";
import { resolvePublicApiBaseUrl } from "../config/publicApiBaseUrl.js";
import {
  validateImageBufferForUpload,
  isAllowedImageMimetype,
} from "../lib/imageUploadValidation.js";
import { isSupabaseStorageConfigured, uploadBufferToSupabasePublicUrl, warnIfSupabaseUrlButNoServiceRole } from "../lib/supabaseStorageClient.js";
import { buildUniqueStorageObjectName } from "../utils/storageObjectName.js";

const UPLOAD_CONFIG_ERROR =
  "Photo upload is not configured on this server. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for Supabase Storage, or PUBLIC_API_BASE_URL with a persistent disk for local uploads.";

const REMOTE_UPLOAD_TIMEOUT_MS = 90_000;

let loggedStorageBackend = false;

function isLocalhostBase(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return /\blocalhost\b/i.test(url);
  }
}

/** True when the API should upload images to Supabase Storage (recommended for production). */
export function isSupabaseStorageConfiguredForUpload(): boolean {
  return isSupabaseStorageConfigured();
}

/** Safe diagnostics for `/health` (no secrets). */
export function getImageUploadStorageDiagnostics(): {
  employeeAvatarStorage: "supabase" | "disk";
  supabaseStorageConfigured: boolean;
} {
  const supabaseStorageConfigured = isSupabaseStorageConfiguredForUpload();
  return {
    employeeAvatarStorage: supabaseStorageConfigured ? "supabase" : "disk",
    supabaseStorageConfigured,
  };
}

function logStorageBackendOnce(): void {
  if (loggedStorageBackend) return;
  loggedStorageBackend = true;
  warnIfSupabaseUrlButNoServiceRole();
  const d = getImageUploadStorageDiagnostics();
  console.info(
    `[upload] Employee avatars: storage=${d.employeeAvatarStorage} (SUPABASE_URL+SERVICE_ROLE_KEY=${d.supabaseStorageConfigured})`,
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function extFromImageMimetype(mimetype: string): string {
  const mt = mimetype.toLowerCase();
  if (mt.includes("png")) return ".png";
  if (mt.includes("webp")) return ".webp";
  if (mt.includes("gif")) return ".gif";
  if (mt.includes("heic") || mt.includes("heif")) return ".heic";
  if (mt.includes("avif")) return ".avif";
  return ".jpg";
}

async function uploadBufferToSupabaseWithTimeout(
  objectKey: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  return withTimeout(
    uploadBufferToSupabasePublicUrl(objectKey, buffer, contentType),
    REMOTE_UPLOAD_TIMEOUT_MS,
    "Supabase storage upload",
  );
}

/**
 * Uploads an image buffer to Supabase Storage when configured; otherwise saves under /uploads/avatars
 * (needs persistent disk + correct PUBLIC_API_BASE_URL in production).
 */
export async function uploadEmployeeAvatarImage(buffer: Buffer, mimetype: string): Promise<string> {
  logStorageBackendOnce();
  validateImageBufferForUpload(buffer, mimetype);

  if (isSupabaseStorageConfiguredForUpload()) {
    try {
      const ext = extFromImageMimetype(mimetype);
      const name = buildUniqueStorageObjectName(`avatar${ext}`, ext);
      const objectKey = `avatars/${name}`;
      return await uploadBufferToSupabaseWithTimeout(objectKey, buffer, mimetype);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[upload] Supabase employee avatar failed:", msg);
      if (/timed out/i.test(msg)) {
        throw new Error("Photo upload timed out. Please try again with a smaller image.");
      }
      throw new Error("We couldn't upload your photo. Please try a JPEG or PNG under 5 MB.");
    }
  }

  const base = resolvePublicApiBaseUrl();
  if (process.env.NODE_ENV === "production" && isLocalhostBase(base)) {
    console.error(
      "[upload] Refusing disk upload: PUBLIC_API_BASE_URL (or host auto-detect) resolves to localhost in production. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY or PUBLIC_API_BASE_URL.",
    );
    throw new Error(UPLOAD_CONFIG_ERROR);
  }

  const mt = mimetype.toLowerCase();
  const ext = mt.includes("png")
    ? "png"
    : mt.includes("webp")
      ? "webp"
      : mt.includes("gif")
        ? "gif"
        : mt.includes("heic") || mt.includes("heif")
          ? "heic"
          : "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "uploads", "avatars");
  const fp = path.join(dir, filename);
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(fp, buffer);
  } catch (e) {
    console.error("[upload] Disk write failed (ephemeral or read-only filesystem?)", e);
    throw new Error(UPLOAD_CONFIG_ERROR);
  }
  return `${base}/uploads/avatars/${filename}`;
}

/**
 * When Supabase is configured, uploads a business logo buffer and returns a public `https://...` URL.
 * On failure returns `null` so callers can keep the on-disk Multer path.
 */
export async function tryUploadBusinessLogoToSupabase(
  buffer: Buffer,
  mimetype: string,
  originalFilename?: string,
): Promise<string | null> {
  warnIfSupabaseUrlButNoServiceRole();
  if (!isSupabaseStorageConfiguredForUpload()) {
    return null;
  }
  try {
    const ext = extFromImageMimetype(mimetype);
    const name = buildUniqueStorageObjectName(originalFilename ?? `logo${ext}`, ext);
    const objectKey = `business-logos/${name}`;
    return await uploadBufferToSupabaseWithTimeout(objectKey, buffer, mimetype);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[upload] Supabase business logo failed (keeping disk path):", msg);
    return null;
  }
}

/** Platform admin: business logo file → public URL or null to keep disk path. */
export async function tryUploadPlatformBusinessLogoToSupabase(
  buffer: Buffer,
  mimetype: string,
  businessId: string,
  originalFilename?: string,
): Promise<string | null> {
  warnIfSupabaseUrlButNoServiceRole();
  if (!isSupabaseStorageConfiguredForUpload()) {
    return null;
  }
  try {
    const ext = pathExtFromMimeOrName(mimetype, originalFilename);
    const name = buildUniqueStorageObjectName(originalFilename ?? `logo${ext}`, ext);
    const objectKey = `platform-logos/${businessId.replace(/[^a-zA-Z0-9-_]/g, "")}/${name}`;
    return await uploadBufferToSupabaseWithTimeout(objectKey, buffer, mimetype);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[upload] Supabase platform business logo failed:", msg);
    return null;
  }
}

/** Platform admin: verification document → public URL or null to keep disk path. */
export async function tryUploadPlatformVerificationToSupabase(
  buffer: Buffer,
  mimetype: string,
  businessId: string,
  originalFilename?: string,
): Promise<string | null> {
  warnIfSupabaseUrlButNoServiceRole();
  if (!isSupabaseStorageConfiguredForUpload()) {
    return null;
  }
  try {
    const ext = pathExtFromMimeOrName(mimetype, originalFilename);
    const name = buildUniqueStorageObjectName(originalFilename ?? `verification${ext}`, ext);
    const objectKey = `platform-verification/${businessId.replace(/[^a-zA-Z0-9-_]/g, "")}/${name}`;
    return await uploadBufferToSupabaseWithTimeout(objectKey, buffer, mimetype);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[upload] Supabase platform verification upload failed:", msg);
    return null;
  }
}

function pathExtFromMimeOrName(mimetype: string, originalFilename?: string): string {
  const fromName = originalFilename ? path.extname(originalFilename) : "";
  if (fromName && /^\.[a-zA-Z0-9]{1,8}$/.test(fromName)) {
    return fromName.toLowerCase();
  }
  const mt = mimetype.toLowerCase();
  if (mt === "application/pdf") return ".pdf";
  if (mt === "application/msword") return ".doc";
  if (mt.includes("wordprocessingml")) return ".docx";
  if (mt.includes("png")) return ".png";
  if (mt.includes("webp")) return ".webp";
  if (mt.includes("gif")) return ".gif";
  if (mt.includes("jpeg") || mt.includes("jpg")) return ".jpg";
  return ".bin";
}

/** Re-export for multer fileFilter (single source of truth). */
export { isAllowedImageMimetype };

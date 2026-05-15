import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "node:path";
import { randomUUID } from "crypto";
import { resolvePublicApiBaseUrl } from "../config/publicApiBaseUrl.js";
import {
  validateImageBufferForUpload,
  isAllowedImageMimetype,
} from "../lib/imageUploadValidation.js";
import {
  isSupabaseStorageConfigured,
  supabaseStorageBucketName,
  ensureSupabaseStorageBucketReady,
  uploadBufferToSupabasePublicUrl,
  warnIfSupabaseUrlButNoServiceRole,
  assertUploadedObjectReadableInBucket,
} from "../lib/supabaseStorageClient.js";
import { buildUniqueStorageObjectName } from "../utils/storageObjectName.js";

const UPLOAD_CONFIG_ERROR = "File upload isn't available right now. Please try again later.";

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
  supabaseStorageBucket?: string;
} {
  const supabaseStorageConfigured = isSupabaseStorageConfiguredForUpload();
  return {
    employeeAvatarStorage: supabaseStorageConfigured ? "supabase" : "disk",
    supabaseStorageConfigured,
    ...(supabaseStorageConfigured ? { supabaseStorageBucket: supabaseStorageBucketName() } : {}),
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

function assertDiskFileExists(absolutePath: string): void {
  if (!existsSync(absolutePath)) {
    throw new Error("Saved file is missing on disk.");
  }
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
      const publicUrl = await uploadBufferToSupabaseWithTimeout(objectKey, buffer, mimetype);
      await assertUploadedObjectReadableInBucket(publicUrl);
      return publicUrl;
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
    assertDiskFileExists(fp);
  } catch (e) {
    console.error("[upload] Disk write failed (ephemeral or read-only filesystem?)", e);
    throw new Error(UPLOAD_CONFIG_ERROR);
  }
  const baseNorm = base.replace(/\/$/, "");
  return `${baseNorm}/uploads/avatars/${filename}`;
}

/**
 * Manager business logo: Supabase public URL (verified readable) or absolute API URL for disk mode.
 * Throws on any failure — callers must not update the database unless this resolves.
 */
export async function uploadManagerBusinessLogoImage(
  buffer: Buffer,
  mimetype: string,
  businessId: string,
  originalFilename?: string,
): Promise<string> {
  logStorageBackendOnce();
  validateImageBufferForUpload(buffer, mimetype);
  const safeBizId = businessId.replace(/[^a-zA-Z0-9-_]/g, "");

  if (isSupabaseStorageConfiguredForUpload()) {
    try {
      const ext = extFromImageMimetype(mimetype);
      const name = buildUniqueStorageObjectName(originalFilename ?? `logo${ext}`, ext);
      const objectKey = `business-logos/${name}`;
      const publicUrl = await uploadBufferToSupabaseWithTimeout(objectKey, buffer, mimetype);
      await assertUploadedObjectReadableInBucket(publicUrl);
      return publicUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[upload] manager business logo (Supabase) failed:", msg);
      if (/timed out/i.test(msg)) {
        throw new Error("Logo upload timed out. Try again with a smaller image.");
      }
      if (/isn't available right now/i.test(msg)) {
        throw new Error(msg);
      }
      if (/too large/i.test(msg)) {
        throw new Error(msg);
      }
      throw new Error(msg.includes("logo") ? msg : "We couldn't save your logo. Please try again.");
    }
  }

  const base = resolvePublicApiBaseUrl();
  if (process.env.NODE_ENV === "production" && isLocalhostBase(base)) {
    throw new Error(UPLOAD_CONFIG_ERROR);
  }
  const ext = extFromImageMimetype(mimetype);
  const name = buildUniqueStorageObjectName(originalFilename ?? `logo${ext}`, ext);
  const relDir = path.join("uploads", "businesses", safeBizId);
  const dir = path.join(process.cwd(), relDir);
  const fp = path.join(dir, name);
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(fp, buffer);
    assertDiskFileExists(fp);
  } catch (e) {
    console.error("[upload] manager business logo disk write failed:", e);
    throw new Error(UPLOAD_CONFIG_ERROR);
  }
  const baseNorm = base.replace(/\/$/, "");
  const relUrl = `${relDir.replace(/\\/g, "/")}/${name}`;
  return `${baseNorm}/${relUrl}`;
}

/** Platform admin: business logo — same persistence rules as manager upload. */
export async function uploadPlatformBusinessLogoImage(
  buffer: Buffer,
  mimetype: string,
  businessId: string,
  originalFilename?: string,
): Promise<string> {
  logStorageBackendOnce();
  validateImageBufferForUpload(buffer, mimetype);
  const safeBizId = businessId.replace(/[^a-zA-Z0-9-_]/g, "");

  if (isSupabaseStorageConfiguredForUpload()) {
    try {
      const ext = pathExtFromMimeOrName(mimetype, originalFilename);
      const name = buildUniqueStorageObjectName(originalFilename ?? `logo${ext}`, ext);
      const objectKey = `platform-logos/${safeBizId}/${name}`;
      const publicUrl = await uploadBufferToSupabaseWithTimeout(objectKey, buffer, mimetype);
      await assertUploadedObjectReadableInBucket(publicUrl);
      return publicUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[upload] platform business logo (Supabase) failed:", msg);
      throw new Error("We couldn't save your logo. Please try again.");
    }
  }

  const base = resolvePublicApiBaseUrl();
  if (process.env.NODE_ENV === "production" && isLocalhostBase(base)) {
    throw new Error(UPLOAD_CONFIG_ERROR);
  }
  const ext = pathExtFromMimeOrName(mimetype, originalFilename);
  const name = buildUniqueStorageObjectName(originalFilename ?? `logo${ext}`, ext);
  const relDir = path.join("uploads", "platform", "businesses", safeBizId);
  const dir = path.join(process.cwd(), relDir);
  const fp = path.join(dir, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(fp, buffer);
  assertDiskFileExists(fp);
  const baseNorm = base.replace(/\/$/, "");
  const relUrl = `${relDir.replace(/\\/g, "/")}/${name}`;
  return `${baseNorm}/${relUrl}`;
}

const VERIFICATION_MAX_BYTES = 10 * 1024 * 1024;

/** Platform admin: verification document (image or PDF/Word). */
export async function uploadPlatformVerificationDocument(
  buffer: Buffer,
  mimetype: string,
  businessId: string,
  originalFilename?: string,
): Promise<string> {
  warnIfSupabaseUrlButNoServiceRole();
  if (!buffer?.length) {
    throw new Error("File is empty.");
  }
  if (buffer.length > VERIFICATION_MAX_BYTES) {
    throw new Error("File is too large (max 10 MB).");
  }
  const safeBizId = businessId.replace(/[^a-zA-Z0-9-_]/g, "");

  if (isSupabaseStorageConfiguredForUpload()) {
    try {
      const ext = pathExtFromMimeOrName(mimetype, originalFilename);
      const name = buildUniqueStorageObjectName(originalFilename ?? `verification${ext}`, ext);
      const objectKey = `platform-verification/${safeBizId}/${name}`;
      const publicUrl = await uploadBufferToSupabaseWithTimeout(objectKey, buffer, mimetype);
      await assertUploadedObjectReadableInBucket(publicUrl);
      return publicUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[upload] platform verification (Supabase) failed:", msg);
      throw new Error("We couldn't save your verification file. Please try again.");
    }
  }

  const base = resolvePublicApiBaseUrl();
  if (process.env.NODE_ENV === "production" && isLocalhostBase(base)) {
    throw new Error(UPLOAD_CONFIG_ERROR);
  }
  const ext = pathExtFromMimeOrName(mimetype, originalFilename);
  const name = buildUniqueStorageObjectName(originalFilename ?? `verification${ext}`, ext);
  const relDir = path.join("uploads", "platform", "businesses", safeBizId);
  const dir = path.join(process.cwd(), relDir);
  const fp = path.join(dir, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(fp, buffer);
  assertDiskFileExists(fp);
  const baseNorm = base.replace(/\/$/, "");
  const relUrl = `${relDir.replace(/\\/g, "/")}/${name}`;
  return `${baseNorm}/${relUrl}`;
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

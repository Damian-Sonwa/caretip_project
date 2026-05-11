import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { resolvePublicApiBaseUrl } from "../config/publicApiBaseUrl.js";
import {
  validateImageBufferForUpload,
  isAllowedImageMimetype,
} from "../lib/imageUploadValidation.js";

const UPLOAD_CONFIG_ERROR =
  "Photo upload is not configured on this server. The administrator should set CLOUDINARY_URL (recommended) or PUBLIC_API_BASE_URL to the API’s public HTTPS URL.";

const CLOUDINARY_UPLOAD_TIMEOUT_MS = 90_000;

let loggedStorageBackend = false;

function isLocalhostBase(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return /\blocalhost\b/i.test(url);
  }
}

function cloudinaryUrlConfigured(): boolean {
  const u = process.env.CLOUDINARY_URL?.trim() ?? "";
  return u.length > 0 && u.toLowerCase().startsWith("cloudinary://");
}

function cloudinaryTripleConfigured(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  return Boolean(cloudName && apiKey && apiSecret);
}

/** Used by controllers to decide whether to mirror disk uploads to Cloudinary (recommended on Render). */
export function isCloudinaryConfiguredForUpload(): boolean {
  return cloudinaryUrlConfigured() || cloudinaryTripleConfigured();
}

/** Safe diagnostics for `/health` (no secrets). */
export function getImageUploadStorageDiagnostics(): {
  employeeAvatarStorage: "cloudinary" | "disk";
  cloudinaryConfigured: boolean;
  cloudinaryUrlPresent: boolean;
  cloudinaryTriplePresent: boolean;
} {
  const cloudinaryConfigured = isCloudinaryConfiguredForUpload();
  return {
    employeeAvatarStorage: cloudinaryConfigured ? "cloudinary" : "disk",
    cloudinaryConfigured,
    cloudinaryUrlPresent: cloudinaryUrlConfigured(),
    cloudinaryTriplePresent: cloudinaryTripleConfigured(),
  };
}

function logStorageBackendOnce(): void {
  if (loggedStorageBackend) return;
  loggedStorageBackend = true;
  const d = getImageUploadStorageDiagnostics();
  console.info(
    `[upload] Employee avatars: storage=${d.employeeAvatarStorage} (CLOUDINARY_URL=${d.cloudinaryUrlPresent}, triple=${d.cloudinaryTriplePresent})`,
  );
}

function configureCloudinaryForUpload(): void {
  if (cloudinaryUrlConfigured()) {
    cloudinary.config(true);
    return;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY!.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET!.trim();
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
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

async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: "caretip/avatars" | "caretip/business-logos",
): Promise<string> {
  configureCloudinaryForUpload();
  const uploadPromise = new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        /** Let Cloudinary infer format; avoids edge cases with HEIC etc. */
        use_filename: false,
        unique_filename: true,
      },
      (err, res) => {
        if (err) {
          const http = (err as { http_code?: number }).http_code;
          const msg = err.message || String(err);
          reject(
            new Error(
              http === 401 || /401|unauthorized/i.test(msg)
                ? "Cloudinary rejected credentials (check CLOUDINARY_URL or API keys)."
                : `${msg}`,
            ),
          );
        } else if (res?.secure_url) {
          resolve(res.secure_url);
        } else {
          reject(new Error("Cloudinary returned no image URL."));
        }
      },
    );
    stream.end(buffer);
  });
  return withTimeout(uploadPromise, CLOUDINARY_UPLOAD_TIMEOUT_MS, "Cloudinary upload");
}

/**
 * Uploads an image buffer to Cloudinary when configured (`CLOUDINARY_URL` or cloud name/key/secret);
 * otherwise saves under /uploads/avatars (needs a persistent disk + correct PUBLIC_API_BASE_URL in production).
 */
export async function uploadEmployeeAvatarImage(buffer: Buffer, mimetype: string): Promise<string> {
  logStorageBackendOnce();
  validateImageBufferForUpload(buffer, mimetype);

  const useCloudinary = isCloudinaryConfiguredForUpload();

  if (useCloudinary) {
    try {
      return await uploadBufferToCloudinary(buffer, "caretip/avatars");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[upload] Cloudinary employee avatar failed:", msg);
      if (/timed out/i.test(msg)) {
        throw new Error("Photo upload timed out. Please try again with a smaller image.");
      }
      if (/rejected credentials|401|unauthorized/i.test(msg)) {
        throw new Error("Photo storage is not available. Please try again later.");
      }
      throw new Error("We couldn't upload your photo. Please try a JPEG or PNG under 5 MB.");
    }
  }

  const base = resolvePublicApiBaseUrl();
  if (process.env.NODE_ENV === "production" && isLocalhostBase(base)) {
    console.error(
      "[upload] Refusing disk upload: PUBLIC_API_BASE_URL (or host auto-detect) resolves to localhost in production. Set CLOUDINARY_URL or PUBLIC_API_BASE_URL.",
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
  const dir = join(process.cwd(), "uploads", "avatars");
  const fp = join(dir, filename);
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
 * When Cloudinary env is set (recommended on Render), uploads a business logo and returns `https://...`.
 * Otherwise returns `null` so callers can keep the on-disk Multer path.
 */
export async function tryUploadBusinessLogoToCloudinary(buffer: Buffer): Promise<string | null> {
  if (!isCloudinaryConfiguredForUpload()) {
    return null;
  }
  try {
    return await uploadBufferToCloudinary(buffer, "caretip/business-logos");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[upload] Cloudinary business logo failed (keeping disk path):", msg);
    return null;
  }
}

/** Re-export for multer fileFilter (single source of truth). */
export { isAllowedImageMimetype };

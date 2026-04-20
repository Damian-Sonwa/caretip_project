import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";

const UPLOAD_CONFIG_ERROR =
  "Photo upload is not configured on this server. The administrator should set CLOUDINARY_URL (recommended) or PUBLIC_API_BASE_URL to the API’s public HTTPS URL.";

/**
 * Public base URL for serving `/uploads/*` when not using Cloudinary.
 * Many hosts set a single env (e.g. RENDER_EXTERNAL_URL) instead of PUBLIC_API_BASE_URL.
 */
function resolvePublicApiBaseUrl(): string {
  const trim = (s: string | undefined) => s?.trim().replace(/\/+$/, "") ?? "";

  const explicit =
    trim(process.env.PUBLIC_API_BASE_URL) ||
    trim(process.env.API_PUBLIC_URL) ||
    trim(process.env.BACKEND_PUBLIC_URL);
  if (explicit) return explicit;

  const render = trim(process.env.RENDER_EXTERNAL_URL);
  if (render) return render;

  const railway = trim(process.env.RAILWAY_PUBLIC_DOMAIN);
  if (railway) {
    const host = railway.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }

  const fly = trim(process.env.FLY_APP_NAME);
  if (fly) return `https://${fly}.fly.dev`;

  const heroku = trim(process.env.HEROKU_APP_NAME);
  if (heroku) return `https://${heroku}.herokuapp.com`;

  const vercel = trim(process.env.VERCEL_URL);
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }

  return `http://localhost:${process.env.PORT ?? 3001}`;
}

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

function configureCloudinaryForUpload(): void {
  if (cloudinaryUrlConfigured()) {
    // Reload from CLOUDINARY_URL (standard on Render, Railway, Heroku, etc.)
    cloudinary.config(true);
    return;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY!.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET!.trim();
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

/**
 * Uploads an image buffer to Cloudinary when configured (`CLOUDINARY_URL` or cloud name/key/secret);
 * otherwise saves under /uploads/avatars (needs a persistent disk + correct PUBLIC_API_BASE_URL in production).
 */
export async function uploadEmployeeAvatarImage(buffer: Buffer, mimetype: string): Promise<string> {
  const useCloudinary = cloudinaryUrlConfigured() || cloudinaryTripleConfigured();

  if (useCloudinary) {
    configureCloudinaryForUpload();
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "caretip/avatars", resource_type: "image" },
        (err, res) => {
          if (err) reject(err);
          else if (res?.secure_url) resolve({ secure_url: res.secure_url });
          else reject(new Error("Upload failed"));
        }
      );
      stream.end(buffer);
    });
    return result.secure_url;
  }

  const base = resolvePublicApiBaseUrl();
  if (process.env.NODE_ENV === "production" && isLocalhostBase(base)) {
    console.error(
      "[upload] Refusing disk upload: PUBLIC_API_BASE_URL (or host auto-detect) resolves to localhost in production. Set CLOUDINARY_URL or PUBLIC_API_BASE_URL."
    );
    throw new Error(UPLOAD_CONFIG_ERROR);
  }

  const ext = mimetype.includes("png")
    ? "png"
    : mimetype.includes("webp")
      ? "webp"
      : mimetype.includes("gif")
        ? "gif"
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

import { parseSupabasePublicStorageUrl } from "../lib/supabaseStorageClient.js";

export const KYC_OBJECT_REF_PREFIX = "kyc-object:";
export const KYC_DISK_REF_PREFIX = "kyc-disk:";

export type ParsedKycStorageRef =
  | { kind: "kyc-object"; bucket: string; objectPath: string; businessId: string }
  | { kind: "kyc-disk"; relativePath: string; businessId: string }
  | { kind: "legacy-public-url"; url: string }
  | { kind: "legacy-disk-url"; url: string };

export function buildKycObjectStorageRef(bucket: string, objectPath: string): string {
  return `${KYC_OBJECT_REF_PREFIX}${bucket}/${objectPath.replace(/^\/+/, "")}`;
}

export function buildKycDiskStorageRef(relativePath: string): string {
  return `${KYC_DISK_REF_PREFIX}${relativePath.replace(/^\/+/, "")}`;
}

export function extractBusinessIdFromKycObjectPath(objectPath: string): string | null {
  const m = objectPath.match(/^verification\/([^/]+)\//);
  return m?.[1] ?? null;
}

export function extractBusinessIdFromKycDiskPath(relativePath: string): string | null {
  const m = relativePath.match(/^uploads\/kyc\/([^/]+)\//);
  return m?.[1] ?? null;
}

export function parseKycStorageReference(raw: string): ParsedKycStorageRef | null {
  const s = raw.trim();
  if (!s) return null;

  if (s.startsWith(KYC_OBJECT_REF_PREFIX)) {
    const rest = s.slice(KYC_OBJECT_REF_PREFIX.length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    const bucket = rest.slice(0, slash);
    const objectPath = rest.slice(slash + 1);
    const businessId = extractBusinessIdFromKycObjectPath(objectPath);
    if (!bucket || !objectPath || !businessId) return null;
    return { kind: "kyc-object", bucket, objectPath, businessId };
  }

  if (s.startsWith(KYC_DISK_REF_PREFIX)) {
    const relativePath = s.slice(KYC_DISK_REF_PREFIX.length);
    const businessId = extractBusinessIdFromKycDiskPath(relativePath);
    if (!relativePath || !businessId) return null;
    return { kind: "kyc-disk", relativePath, businessId };
  }

  if (/^https?:\/\//i.test(s)) {
    if (/\.supabase\.co\/storage\/v1\/object\/public\//i.test(s)) {
      return { kind: "legacy-public-url", url: s };
    }
    if (/\/uploads\//i.test(s)) {
      return { kind: "legacy-disk-url", url: s };
    }
    return { kind: "legacy-public-url", url: s };
  }

  if (s.startsWith("/uploads/")) {
    return { kind: "legacy-disk-url", url: s };
  }

  return null;
}

export function legacyPublicUrlToObjectPath(publicUrl: string): { bucket: string; objectPath: string } | null {
  return parseSupabasePublicStorageUrl(publicUrl);
}

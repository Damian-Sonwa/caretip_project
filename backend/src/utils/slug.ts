import { randomBytes } from "node:crypto";

/**
 * Converts a display name to a URL-safe slug:
 * - Unicode normalized (NFKD) and accents stripped (e.g. "Lily's" → "lilys")
 * - Lowercase, spaces → hyphens, non [a-z0-9-] removed
 */
export function generateSlug(name: string): string {
  if (!name?.trim()) return "staff";
  const base = name
    .trim()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "staff";
}

/** Allowed persisted slug segment: lowercase letters, digits, hyphens; reasonable length. */
export function isValidPublicSlugSegment(slug: string): boolean {
  const s = slug?.trim() ?? "";
  if (s.length < 1 || s.length > 96) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
}

export function assertValidPublicSlugSegment(slug: string, label: string): void {
  if (!isValidPublicSlugSegment(slug)) {
    throw new Error(`Invalid ${label}`);
  }
}

function shortUniqueSuffix(): string {
  return randomBytes(2).toString("hex");
}

/**
 * Ensures slug is unique by appending a short hex suffix if needed.
 */
export async function ensureUniqueSlug(
  baseSlugIn: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  let baseSlug = baseSlugIn;
  if (!isValidPublicSlugSegment(baseSlug)) {
    const cleaned = generateSlug(baseSlug) || "staff";
    baseSlug = isValidPublicSlugSegment(cleaned) ? cleaned : `staff-${shortUniqueSuffix()}`;
  }

  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 100;
  while (await exists(slug)) {
    attempts++;
    slug = `${baseSlug}-${shortUniqueSuffix()}`;
    if (attempts >= maxAttempts) {
      slug = `${baseSlug}-${randomBytes(4).toString("hex")}`;
      break;
    }
  }
  return slug;
}

/**
 * Converts a name to a URL-safe slug:
 * - Lowercase
 * - Spaces → hyphens
 * - Removes special characters (keeps alphanumeric and hyphens)
 */
export function generateSlug(name: string): string {
  if (!name?.trim()) return "staff";
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "staff";
}

/**
 * Ensures slug is unique by appending a short suffix if needed.
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 100;
  while (await exists(slug)) {
    attempts++;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 8)}`;
    if (attempts >= maxAttempts) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }
  return slug;
}

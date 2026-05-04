/**
 * Public HTTPS origin of this API (no trailing slash).
 * Used for disk uploads and for turning stored `/uploads/...` paths into absolute URLs in JSON.
 */
export function resolvePublicApiBaseUrl(): string {
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

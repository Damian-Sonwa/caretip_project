/**
 * Web OAuth client ID for `@react-oauth/google`.
 * Vite inlines `import.meta.env` at **build** time — set on your host (e.g. Vercel) and redeploy.
 *
 * - Prefer `VITE_GOOGLE_CLIENT_ID` (canonical for this repo).
 * - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is accepted because `vite.config.ts` uses `envPrefix` including `NEXT_PUBLIC_`
 *   (some teams set only that name on Vercel).
 */
export function googleOAuthWebClientId(): string {
  const a = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
  const b = import.meta.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  return a || b;
}

/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Optional URL (e.g. `/videos/how-it-works.webm`) for the Live in minutes laptop demo; when unset, an in-browser slideshow is used. */
  readonly VITE_LIVE_IN_MINUTES_DEMO_VIDEO?: string;
  readonly VITE_API_URL?: string;
  /** @deprecated Prefer `NEXT_PUBLIC_APP_URL`. If set to an http(s) SPA origin, used for QR/share base when `NEXT_PUBLIC_APP_URL` is unset. */
  readonly VITE_APP_URL?: string;
  readonly NEXT_PUBLIC_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

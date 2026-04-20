/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** @deprecated Prefer `NEXT_PUBLIC_APP_URL`. If set to an http(s) SPA origin, used for QR/share base when `NEXT_PUBLIC_APP_URL` is unset. */
  readonly VITE_APP_URL?: string;
  readonly NEXT_PUBLIC_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

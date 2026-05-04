/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Optional URL (e.g. `/videos/how-it-works.webm`) for the Live in minutes laptop demo; when unset, an in-browser slideshow is used. */
  readonly VITE_LIVE_IN_MINUTES_DEMO_VIDEO?: string;
  readonly VITE_API_URL?: string;
  /**
   * Injected at build/dev from `BASE_URL` / `VITE_BASE_URL` / `NEXT_PUBLIC_APP_URL` / `VITE_APP_URL`
   * (see `vite.config.ts`). Prefer setting **`BASE_URL`** in CI/host env for production QR links.
   */
  readonly VITE_CARETIP_APP_ORIGIN?: string;
  /** Optional public SPA origin for QR and share links (same semantics as part of `BASE_URL` chain). */
  readonly VITE_BASE_URL?: string;
  readonly NEXT_PUBLIC_BASE_URL?: string;
  /** @deprecated Prefer `BASE_URL` at build or `NEXT_PUBLIC_BASE_URL`. Legacy SPA origin for QR when others unset. */
  readonly VITE_APP_URL?: string;
  readonly NEXT_PUBLIC_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

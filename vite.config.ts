import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  /** Required for correct asset URLs on Vercel and other static hosts. */
  base: '/',
  /** Expose VITE_* and NEXT_PUBLIC_* from .env to import.meta.env (QR / app URL). */
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2500,
  },
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'favicon-32.png',
      ],
      manifest: {
        /** Stable id helps Chromium replace the installed app manifest on updates (splash colors). */
        id: '/',
        name: 'CareTip',
        short_name: 'CareTip',
        description:
          'Digital tipping for hospitality: scan, tip, and support your team.',
        /** Off-white launch screen — matches first paint + branded loading overlay (no orange flash). */
        theme_color: '#FAF9F6',
        background_color: '#FAF9F6',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'en',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          /** Intentionally no maskable entry: Chromium/Android may composite maskable icons as monochrome silhouettes. */
        ],
      },
      workbox: {
        /** Bump when PWA shell/manifest semantics change so old precaches are abandoned. */
        cacheId: 'caretip-pwa-v9',
        /** Ensure old precaches are removed when SW updates. */
        cleanupOutdatedCaches: true,
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2,webp,json,webmanifest}',
        ],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [
          /^\/api(\/|$)/,
          /^\/uploads(\/|$)/,
          /^\/socket\.io/,
        ],
        /** Logo and large hashed assets may exceed Workbox default (2 MiB). */
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'caretip-google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory (ESM-safe; no __dirname)
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },

  // Same proxy for `vite preview` so /api works without VITE_API_URL in the built app.
  preview: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})

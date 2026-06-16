import "./lib/fonts/inter";
import "./lib/fonts/heroDisplay";
import "./app/lib/pwaInstallDeferred";
import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./app/App";
import { GlobalErrorBoundary } from "./app/components/GlobalErrorBoundary";
import { wakeRemoteApi, migrateLegacyAccessTokenFromStorage } from "./app/lib/api";
import { ensureI18nReady } from "./i18n/i18n";
import { initSentry } from "./app/lib/sentry";
import "./styles/index.css";

initSentry();
migrateLegacyAccessTokenFromStorage();
wakeRemoteApi();

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Keep production in sync with latest CSS/images. Without this, a deployed
    // update can sit idle until the user manually reloads or closes all tabs.
    updateSW(true);
  },
});

void ensureI18nReady().then(() => {
  createRoot(document.getElementById("root")!).render(
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>,
  );
});

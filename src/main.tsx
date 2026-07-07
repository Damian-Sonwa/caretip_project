import "./lib/fonts/inter";
import "./app/lib/pwaInstallDeferred";
import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./app/App";
import { GlobalErrorBoundary } from "./app/components/GlobalErrorBoundary";
import { wakeRemoteApi, migrateLegacyAccessTokenFromStorage } from "./app/lib/api";
import { ensureI18nReady } from "./i18n/i18n";
import { initSentry } from "./app/lib/sentry";
import { initGoogleAdsConversion } from "./app/lib/googleAdsConversion";
import {
  initCareTipStartupOrchestrator,
  markCareTipStartupReactMounted,
} from "./app/lib/caretipStartupSession";
import "./styles/index.css";

/** Manrope display font — marketing headings only; skip on auth/admin shells. */
function scheduleHeroDisplayFont(): void {
  if (typeof window === "undefined") return;
  const p = window.location.pathname.split("?")[0]?.split("#")[0] ?? "/";
  const marketingDisplay =
    p === "/" ||
    p === "/pricing" ||
    p === "/features" ||
    p === "/how-it-works" ||
    p === "/contact" ||
    p === "/faq" ||
    p === "/mobile-app" ||
    p === "/careers" ||
    p === "/blog" ||
    p.startsWith("/hero");
  if (marketingDisplay) {
    void import("./lib/fonts/heroDisplay");
  }
}

scheduleHeroDisplayFont();
initGoogleAdsConversion();

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
  markCareTipStartupReactMounted();
  initCareTipStartupOrchestrator();
});

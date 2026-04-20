import "./app/lib/pwaInstallDeferred";
import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./app/App";
import { GlobalErrorBoundary } from "./app/components/GlobalErrorBoundary";
import "./styles/index.css";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Keep production in sync with latest CSS/images. Without this, a deployed
    // update can sit idle until the user manually reloads or closes all tabs.
    updateSW(true);
  },
});

createRoot(document.getElementById("root")!).render(
  <GlobalErrorBoundary>
    <App />
  </GlobalErrorBoundary>
);

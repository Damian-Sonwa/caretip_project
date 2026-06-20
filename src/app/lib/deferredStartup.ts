import { registerSW } from "virtual:pwa-register";
import { migrateLegacyAccessTokenFromStorage } from "./accessTokenStore";
import { initSentry } from "./sentry";
import { wakeRemoteApi } from "./wakeRemoteApi";
import { runWhenIdle } from "./runWhenIdle";

let started = false;

/** PWA, Sentry, API wake — must not block first paint. */
export function scheduleDeferredStartup(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  runWhenIdle(() => {
    initSentry();
    migrateLegacyAccessTokenFromStorage();
    wakeRemoteApi();

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true);
      },
    });
  });
}

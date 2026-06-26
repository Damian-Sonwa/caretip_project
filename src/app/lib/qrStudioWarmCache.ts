import { scheduleIdleWork } from "@/lib/publicRouteDefer";
import { fetchBusinessBrandingSettings } from "./api";
import { fetchVenueCatalog } from "./businessVenueCatalog";

let warmed = false;

/** Idle prefetch for QR Studio routes — venue catalog + branding settings. */
export function preloadQrStudioDashboardData(): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  scheduleIdleWork(() => {
    void fetchVenueCatalog().catch(() => {});
    void fetchBusinessBrandingSettings().catch(() => {});
  }, 2_500);
}

export function resetQrStudioWarmCache(): void {
  warmed = false;
}

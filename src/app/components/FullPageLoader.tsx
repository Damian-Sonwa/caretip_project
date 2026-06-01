import { AppBrandedLoadingScreen } from "./AppBrandedLoadingScreen";
import { GlobalAppLoadingHold } from "./GlobalAppLoadingHold";
import { useGlobalAppLoadingActive } from "../lib/globalAppLoading";

export function FullPageLoader({ message }: { message?: string }) {
  const globalLoadingActive = useGlobalAppLoadingActive();
  if (globalLoadingActive) {
    return <GlobalAppLoadingHold />;
  }
  return <AppBrandedLoadingScreen message={message} />;
}

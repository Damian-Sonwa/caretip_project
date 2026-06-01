import { GlobalAppLoadingHold } from "./GlobalAppLoadingHold";

/**
 * Route gate placeholder — global overlay owns the spinner.
 * Never render a second fullscreen loader here.
 */
export function AppRouteGateShell() {
  return <GlobalAppLoadingHold />;
}

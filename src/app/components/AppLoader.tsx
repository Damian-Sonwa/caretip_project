import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";

type AppLoaderProps = {
  message?: string;
  /** Override default route-guard priority (e.g. APP_INIT for page sync). */
  priority?: (typeof APP_LOADING_PRIORITY)[keyof typeof APP_LOADING_PRIORITY];
  registrationKey?: string;
};

/**
 * Registers a blocking load with the global overlay — does not render a nested spinner.
 * Prefer {@link useAppLoadingRegistration} in new code.
 */
export function AppLoader({
  message,
  priority = APP_LOADING_PRIORITY.ROUTE_GUARD,
  registrationKey = "app-loader",
}: AppLoaderProps) {
  useAppLoadingRegistration(registrationKey, priority, true, message);
  return null;
}

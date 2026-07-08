import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";
import { GlobalAppLoadingHold } from "./GlobalAppLoadingHold";

export function FullPageLoader({
  message,
  registrationKey = "full-page-loader",
}: {
  message?: string;
  registrationKey?: string;
}) {
  useAppLoadingRegistration(
    registrationKey,
    APP_LOADING_PRIORITY.ROUTE_GUARD,
    true,
    message,
  );
  return <GlobalAppLoadingHold />;
}

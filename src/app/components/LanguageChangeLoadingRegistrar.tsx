import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";
import { resolveAppLoadingContextMessage } from "../lib/appLoadingContexts";
import {
  isAppLanguageChangeActive,
  subscribeAppLanguageChange,
} from "../lib/appLanguageLoading";

/** Brief branded overlay while locale bundles apply after a language switch. */
export function LanguageChangeLoadingRegistrar({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const active = useSyncExternalStore(
    subscribeAppLanguageChange,
    isAppLanguageChangeActive,
    () => false,
  );

  useAppLoadingRegistration(
    "app-language-change",
    APP_LOADING_PRIORITY.ROUTE_GUARD,
    active,
    resolveAppLoadingContextMessage("language", t),
  );

  return <>{children}</>;
}

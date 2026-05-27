import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import { I18N_STORAGE_KEY } from "./constants";

export type AppLanguage = "de" | "en";

export function readStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "de";
  try {
    const v = localStorage.getItem(I18N_STORAGE_KEY);
    if (v === "en" || v === "de") return v;
  } catch {
    /* ignore */
  }
  return "de";
}

let initPromise: Promise<typeof i18n> | null = null;

async function loadLocaleBundle(lng: AppLanguage): Promise<typeof en> {
  if (lng === "en") return en;
  const mod = await import("./locales/de.json");
  const bundle = (mod as { default?: typeof en }).default ?? (mod as unknown as typeof en);
  return bundle;
}

/** Ensure translation resources exist before switching language. */
export async function ensureLocaleBundle(lng: AppLanguage): Promise<void> {
  await ensureI18nReady();
  if (i18n.hasResourceBundle(lng, "translation")) return;
  const bundle = await loadLocaleBundle(lng);
  i18n.addResourceBundle(lng, "translation", bundle, true, true);
}

/**
 * Switch UI language after the target locale bundle is loaded (avoids missing keys).
 */
export async function changeAppLanguage(lng: AppLanguage): Promise<void> {
  await ensureLocaleBundle(lng);
  await i18n.changeLanguage(lng);
}

/**
 * Initialize i18n before first React render.
 * English ships in the main bundle; German loads as a separate chunk when needed.
 */
export function ensureI18nReady(): Promise<typeof i18n> {
  if (i18n.isInitialized) return Promise.resolve(i18n);
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const lng = readStoredLanguage();
    const resources: Record<string, { translation: typeof en }> = {
      en: { translation: en },
    };
    if (lng === "de") {
      resources.de = { translation: await loadLocaleBundle("de") };
    }

    await i18n.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: "en",
      supportedLngs: ["de", "en"],
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });

    i18n.on("languageChanged", (nextLng) => {
      try {
        if (nextLng === "en" || nextLng === "de") {
          localStorage.setItem(I18N_STORAGE_KEY, nextLng);
        }
      } catch {
        /* ignore */
      }
    });

    return i18n;
  })();

  return initPromise;
}

export default i18n;

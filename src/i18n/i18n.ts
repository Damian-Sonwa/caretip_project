import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import de from "./locales/de.json";
import { I18N_STORAGE_KEY } from "./constants";

function readStoredLanguage(): "de" | "en" {
  if (typeof window === "undefined") return "de";
  try {
    const v = localStorage.getItem(I18N_STORAGE_KEY);
    if (v === "en" || v === "de") return v;
  } catch {
    /* ignore */
  }
  return "de";
}

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: readStoredLanguage(),
  fallbackLng: "en",
  supportedLngs: ["de", "en"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

i18n.on("languageChanged", (lng) => {
  try {
    if (lng === "en" || lng === "de") localStorage.setItem(I18N_STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
});

export default i18n;

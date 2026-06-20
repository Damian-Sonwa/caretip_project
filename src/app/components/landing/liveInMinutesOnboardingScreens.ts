import enStep01 from "../../../../images/onboarding/en-step-01-create-account.jpeg";
import enStep02 from "../../../../images/onboarding/en-step-02-add-team.jpeg";
import enStep03 from "../../../../images/onboarding/en-step-03-activate-qr.jpeg";
import enStep04 from "../../../../images/onboarding/en-step-04-receive-tips.jpeg";
import deStep01 from "../../../../images/onboarding/de-step-01-konto-erstellen.jpeg";
import deStep02 from "../../../../images/onboarding/de-step-02-team-einladen.jpeg";
import deStep03 from "../../../../images/onboarding/de-step-03-qr-aktivieren.jpeg";
import deStep04 from "../../../../images/onboarding/de-step-04-tipps-empfangen.jpeg";

export type OnboardingLocale = "en" | "de";

/** Step index 0–3 aligned with SimpleSetupSection (account → team → QR → tips). */
export const LIVE_MINUTES_ONBOARDING_STEP_COUNT = 4;

const ONBOARDING_SCREEN_SOURCES: Record<OnboardingLocale, readonly string[]> = {
  en: [enStep01, enStep02, enStep03, enStep04],
  de: [deStep01, deStep02, deStep03, deStep04],
};

const STEP_LABELS: Record<OnboardingLocale, readonly string[]> = {
  en: [
    "Create your account",
    "Add your team",
    "Activate QR codes",
    "Start receiving tips",
  ],
  de: [
    "Konto erstellen",
    "Team hinzufügen",
    "QR-Codes aktivieren",
    "Tipps empfangen",
  ],
};

const preloadPromises = new Map<string, Promise<void>>();
const preloadedSources = new Set<string>();

export function resolveLiveMinutesOnboardingLocale(language?: string): OnboardingLocale {
  return language?.toLowerCase().startsWith("de") ? "de" : "en";
}

export function getLiveMinutesOnboardingScreenSources(
  locale: OnboardingLocale,
): readonly string[] {
  return ONBOARDING_SCREEN_SOURCES[locale];
}

export function getLiveMinutesOnboardingScreenSrc(
  locale: OnboardingLocale,
  stepIndex: number,
): string | undefined {
  const sources = ONBOARDING_SCREEN_SOURCES[locale];
  const clamped = Math.min(Math.max(0, stepIndex), sources.length - 1);
  const src = sources[clamped];
  return src || undefined;
}

export function getLiveMinutesOnboardingScreenAlt(
  locale: OnboardingLocale,
  stepIndex: number,
): string {
  const clamped = Math.min(Math.max(0, stepIndex), STEP_LABELS[locale].length - 1);
  return STEP_LABELS[locale][clamped] ?? "CareTip onboarding";
}

function preloadSingleOnboardingScreen(src: string): Promise<void> {
  const existing = preloadPromises.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve) => {
    const finish = () => {
      preloadedSources.add(src);
      resolve();
    };

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (typeof img.decode === "function") {
        void img.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };
    img.onerror = finish;
    img.src = src;
  });

  preloadPromises.set(src, promise);
  return promise;
}

/** Preload onboarding screenshots and decode them so step switches feel instant. */
export function preloadLiveMinutesOnboardingScreens(
  locales: OnboardingLocale | OnboardingLocale[] = ["en", "de"],
): Promise<void> {
  const list = Array.isArray(locales) ? locales : [locales];
  const tasks: Promise<void>[] = [];

  for (const locale of list) {
    for (const src of ONBOARDING_SCREEN_SOURCES[locale]) {
      if (!src) continue;
      tasks.push(preloadSingleOnboardingScreen(src));
    }
  }

  return Promise.all(tasks).then(() => undefined);
}

export function isLiveMinutesOnboardingScreenPreloaded(src: string): boolean {
  return preloadedSources.has(src);
}

if (typeof window !== "undefined") {
  const schedule = () => {
    void preloadLiveMinutesOnboardingScreens(["en", "de"]);
  };
  if ("requestIdleCallback" in window) {
    requestIdleCallback(schedule, { timeout: 5000 });
  } else {
    window.setTimeout(schedule, 2500);
  }
}

if (import.meta.env.DEV) {
  for (const locale of ["en", "de"] as const) {
    ONBOARDING_SCREEN_SOURCES[locale].forEach((src, index) => {
      if (!src) {
        console.warn(
          `[Live in Minutes] Missing onboarding screenshot: ${locale} step ${index + 1}`,
        );
      }
    });
  }
}

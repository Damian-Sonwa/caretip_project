import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  dispatchLandingIntent,
  isLandingAiUnlocked,
  LANDING_INTENT_AUTO_OPEN,
  LANDING_INTENT_THRESHOLD,
  recordLandingIntent,
  subscribeLandingIntent,
  type LandingIntentEvent,
} from "../../lib/landingAiIntent";
import { trackLandingAiEvent } from "../../lib/landingAiAnalytics";
import { isAiAssistantEnabled } from "../../lib/featureFlags";

const LandingOnboardingAssistant = lazy(() =>
  import("./LandingOnboardingAssistant").then((m) => ({
    default: m.LandingOnboardingAssistant,
  })),
);

const TIME_ON_PAGE_MS = 45_000;
const SCROLL_DEPTH_RATIO = 0.42;

type LandingOnboardingAssistantHostProps = {
  /** Set via callback ref on the landing root — object refs are often null on first effect run. */
  rootEl: HTMLElement | null;
};

function hrefMatchesIntent(href: string): LandingIntentEvent | null {
  const h = href.toLowerCase();
  if (h.includes("/pricing") || h.includes("pricing")) return "pricing_click";
  if (h.includes("/faq")) return "faq_interaction";
  if (h.includes("signup") || h.includes("mode=signup")) return "signup_click";
  if (h.includes("/auth") || h.includes("/join") || h.includes("/how-it-works")) return "cta_click";
  return null;
}

function intentFromTarget(target: HTMLElement | null): LandingIntentEvent | null {
  if (!target) return null;
  const tagged = target.closest?.("[data-landing-intent]") as HTMLElement | null;
  if (tagged) {
    const raw = tagged.getAttribute("data-landing-intent");
    const allowed: LandingIntentEvent[] = [
      "pricing_click",
      "faq_interaction",
      "signup_click",
      "cta_click",
      "onboarding_attempt",
    ];
    if (raw && (allowed as string[]).includes(raw)) return raw as LandingIntentEvent;
  }
  const anchor = target.closest?.("a[href]") as HTMLAnchorElement | null;
  if (anchor) return hrefMatchesIntent(anchor.getAttribute("href") ?? "");
  return null;
}

export function LandingOnboardingAssistantHost({ rootEl }: LandingOnboardingAssistantHostProps) {
  if (!isAiAssistantEnabled()) return null;

  return <LandingOnboardingAssistantHostActive rootEl={rootEl} />;
}

function LandingOnboardingAssistantHostActive({ rootEl }: LandingOnboardingAssistantHostProps) {
  const [launcherVisible, setLauncherVisible] = useState(false);
  const [autoOpenOnce, setAutoOpenOnce] = useState(false);
  const thresholdLoggedRef = useRef(false);

  useEffect(() => {
    if (isLandingAiUnlocked()) setLauncherVisible(true);
  }, []);

  useEffect(() => {
    return subscribeLandingIntent((s) => {
      if (s >= LANDING_INTENT_THRESHOLD) {
        setLauncherVisible(true);
        if (!thresholdLoggedRef.current) {
          thresholdLoggedRef.current = true;
          trackLandingAiEvent("intent_threshold", { score: s });
        }
      }
      if (s >= LANDING_INTENT_AUTO_OPEN) {
        setAutoOpenOnce(true);
      }
    });
  }, []);

  useEffect(() => {
    const tmr = window.setTimeout(() => {
      recordLandingIntent("time_45s");
    }, TIME_ON_PAGE_MS);
    return () => window.clearTimeout(tmr);
  }, []);

  useEffect(() => {
    if (!rootEl) return;
    let scrollFired = false;

    const onScroll = () => {
      if (scrollFired) return;
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      if (scrollTop / scrollHeight >= SCROLL_DEPTH_RATIO) {
        scrollFired = true;
        recordLandingIntent("scroll_depth");
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [rootEl]);

  useEffect(() => {
    if (!rootEl) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !rootEl.contains(target)) return;
      const intent = intentFromTarget(target);
      if (intent) dispatchLandingIntent(intent);
    };

    rootEl.addEventListener("click", onClick, true);
    return () => rootEl.removeEventListener("click", onClick, true);
  }, [rootEl]);

  const onAutoOpenConsumed = useCallback(() => setAutoOpenOnce(false), []);

  if (!launcherVisible) return null;

  return (
    <Suspense fallback={null}>
      <LandingOnboardingAssistant
        launcherVisible={launcherVisible}
        autoOpenOnce={autoOpenOnce}
        onAutoOpenConsumed={onAutoOpenConsumed}
      />
    </Suspense>
  );
}

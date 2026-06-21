/**
 * Development-only guards against translation key leakage and missing keys.
 * No-op in production builds.
 */

import type { i18n as I18nInstance } from "i18next";

/** Matches dot-separated i18n keys shown as raw UI text (e.g. tipFlow.staffLanding.leaveTip). */
const I18N_KEY_LEAK_PATTERN = /^[a-z][a-z0-9]*(\.[a-z][a-zA-Z0-9]*){1,8}$/;

const warnedMissing = new Set<string>();
const warnedDomLeaks = new Set<string>();

function isLikelyI18nKeyLeak(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 120) return false;
  if (!I18N_KEY_LEAK_PATTERN.test(trimmed)) return false;
  // Ignore single-segment words that are valid UI (rare)
  if (!trimmed.includes(".")) return false;
  return true;
}

function scanDomForKeyLeaks(): void {
  if (typeof document === "undefined") return;

  const elements = document.querySelectorAll("body *");
  for (const el of elements) {
    if (el.closest("[data-i18n-ignore]")) continue;
    const tag = el.tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "noscript") continue;

    const text = (el.childNodes.length === 1 && el.childNodes[0]?.nodeType === Node.TEXT_NODE
      ? el.textContent
      : null)?.trim();

    if (!text || !isLikelyI18nKeyLeak(text)) continue;
    if (warnedDomLeaks.has(text)) continue;

    warnedDomLeaks.add(text);
    console.warn(
      `[i18n integrity] Possible translation key visible in UI: "${text}"`,
      el,
    );
  }
}

let domObserver: MutationObserver | null = null;
let scanScheduled = false;

function scheduleDomScan(): void {
  if (scanScheduled) return;
  scanScheduled = true;
  requestAnimationFrame(() => {
    scanScheduled = false;
    scanDomForKeyLeaks();
  });
}

/**
 * Attach missing-key logging and optional DOM leak scanning (dev only).
 */
export function registerI18nIntegrityDev(instance: I18nInstance): void {
  if (!import.meta.env.DEV) return;

  instance.on("missingKey", (_lngs, _ns, key) => {
    if (warnedMissing.has(key)) return;
    warnedMissing.add(key);
    console.warn(`[i18n integrity] Missing translation key: "${key}"`);
  });

  instance.on("languageChanged", () => {
    warnedDomLeaks.clear();
    scheduleDomScan();
  });

  if (typeof document === "undefined") return;

  scheduleDomScan();

  domObserver = new MutationObserver(() => {
    scheduleDomScan();
  });

  domObserver.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });
}

export function teardownI18nIntegrityDev(): void {
  domObserver?.disconnect();
  domObserver = null;
}

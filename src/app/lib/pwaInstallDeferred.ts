/**
 * Captures `beforeinstallprompt` as soon as the bundle loads. Chromium may emit
 * this before React mounts; a listener only in `useEffect` can miss it entirely.
 */

export type PwaBeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferred: PwaBeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore subscriber errors */
    }
  });
}

if (typeof window !== "undefined") {
  window.addEventListener(
    "beforeinstallprompt",
    (e) => {
      e.preventDefault();
      deferred = e as PwaBeforeInstallPromptEvent;
      notify();
    },
    { capture: true }
  );

  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function getPwaInstallDeferred(): PwaBeforeInstallPromptEvent | null {
  return deferred;
}

/** Subscribe to deferred prompt availability; calls `onChange` immediately and whenever it updates. */
export function subscribePwaInstallDeferred(onChange: () => void): () => void {
  listeners.add(onChange);
  onChange();
  return () => listeners.delete(onChange);
}

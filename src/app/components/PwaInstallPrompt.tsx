import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import {
  getPwaInstallDeferred,
  subscribePwaInstallDeferred,
  type PwaBeforeInstallPromptEvent,
} from "@/app/lib/pwaInstallDeferred";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

const STORAGE_KEY = "caretip-pwa-install-dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Shows install affordance when the browser supports it (Android/desktop Chromium)
 * or brief iOS “Add to Home Screen” guidance. Hidden when already installed or dismissed.
 */
export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<PwaBeforeInstallPromptEvent | null>(() =>
    readDismissed() || isStandalone() ? null : getPwaInstallDeferred()
  );
  const [iosHint, setIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    if (isStandalone() || readDismissed()) return;

    const onChange = () => {
      if (readDismissed() || isStandalone()) {
        setDeferred(null);
        return;
      }
      setDeferred(getPwaInstallDeferred());
    };

    const unsub = subscribePwaInstallDeferred(onChange);

    if (isIosSafari()) {
      setIosHint(true);
    }

    return unsub;
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setDeferred(null);
    setIosHint(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    setDeferred(null);
  }, [deferred]);

  if (isStandalone() || dismissed) return null;

  if (deferred) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md sm:rounded-xl sm:border"
        role="region"
        aria-label="Install CareTip"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Install CareTip</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add the app for quick access and offline support.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={install}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary-hover"
              >
                Install
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (iosHint) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-md sm:rounded-xl sm:border"
        role="region"
        aria-label="Add CareTip to Home Screen"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Add to Home Screen</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tap <span className="font-medium">Share</span>, then{" "}
              <span className="font-medium">Add to Home Screen</span> to install CareTip.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-3 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Got it
            </button>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

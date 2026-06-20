import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import {
  MOBILE_MENU_DISMISS_GUARD_MS,
  MOBILE_MENU_TOGGLE_DEBOUNCE_MS,
  canAcceptMobileMenuToggle,
  canDismissMobileMenuOverlay,
} from "../lib/mobileMenuDismissGuard";

export type CloseMobileMenuSource = "immediate" | "backdrop" | "navigate" | "toggle";

/**
 * Mobile menu state — debounce + dismiss guard + post-close open suppressor
 * to prevent Samsung/iOS double-fire and rapid-tap race conditions.
 */
export function useMobileMenuState() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backdropDismissible, setBackdropDismissible] = useState(false);
  const openedAtRef = useRef(0);
  const lastToggleAtRef = useRef(0);
  const suppressOpenUntilRef = useRef(0);
  const openRef = useRef(false);
  const pathnameRef = useRef<string | null>(null);
  const location = useLocation();

  const setMenuOpen = useCallback((open: boolean) => {
    openRef.current = open;
    setMobileMenuOpen(open);
  }, []);

  const recordMenuClosed = useCallback((now = performance.now()) => {
    suppressOpenUntilRef.current = now + MOBILE_MENU_TOGGLE_DEBOUNCE_MS;
  }, []);

  useEffect(() => {
    if (pathnameRef.current === null) {
      pathnameRef.current = location.pathname;
      return;
    }
    if (pathnameRef.current === location.pathname) return;
    pathnameRef.current = location.pathname;
    recordMenuClosed();
    setMenuOpen(false);
  }, [location.pathname, recordMenuClosed, setMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setBackdropDismissible(false);
      return;
    }
    openedAtRef.current = performance.now();
    const id = window.setTimeout(
      () => setBackdropDismissible(true),
      MOBILE_MENU_DISMISS_GUARD_MS,
    );
    return () => window.clearTimeout(id);
  }, [mobileMenuOpen]);

  const markToggle = useCallback((now: number) => {
    lastToggleAtRef.current = now;
  }, []);

  const openMobileMenu = useCallback(() => {
    const now = performance.now();
    if (!canAcceptMobileMenuToggle(lastToggleAtRef.current, now)) return;
    if (now < suppressOpenUntilRef.current) return;
    if (openRef.current) return;
    markToggle(now);
    setMenuOpen(true);
  }, [markToggle, setMenuOpen]);

  const closeMobileMenu = useCallback(
    (source: CloseMobileMenuSource = "immediate") => {
      if (
        (source === "backdrop" || source === "toggle") &&
        !canDismissMobileMenuOverlay(openedAtRef.current)
      ) {
        if (source === "toggle") markToggle(performance.now());
        return;
      }
      if (source === "toggle") {
        const now = performance.now();
        if (!canAcceptMobileMenuToggle(lastToggleAtRef.current, now)) return;
        markToggle(now);
      }
      recordMenuClosed();
      setMenuOpen(false);
    },
    [markToggle, recordMenuClosed, setMenuOpen],
  );

  const toggleMobileMenu = useCallback(() => {
    const now = performance.now();
    if (!canAcceptMobileMenuToggle(lastToggleAtRef.current, now)) return;

    if (openRef.current) {
      if (!canDismissMobileMenuOverlay(openedAtRef.current, now)) {
        markToggle(now);
        return;
      }
      markToggle(now);
      recordMenuClosed();
      setMenuOpen(false);
    } else {
      if (now < suppressOpenUntilRef.current) return;
      markToggle(now);
      setMenuOpen(true);
    }
  }, [markToggle, recordMenuClosed, setMenuOpen]);

  return {
    mobileMenuOpen,
    openMobileMenu,
    closeMobileMenu,
    toggleMobileMenu,
    backdropDismissible,
  };
}

import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";

/**
 * Mobile menu state — open is explicit (not toggle) so the first tap always opens.
 * Closes automatically on route change.
 */
export function useMobileMenuState() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return { mobileMenuOpen, openMobileMenu, closeMobileMenu };
}

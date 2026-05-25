import type { ReactNode } from "react";
import { useAuthInitializer } from "../hooks/useAuthInitializer";

/**
 * Mounts session bootstrap once for the whole app so refresh on protected routes
 * waits for /api/auth/refresh before guards redirect to login.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  useAuthInitializer();
  return <>{children}</>;
}

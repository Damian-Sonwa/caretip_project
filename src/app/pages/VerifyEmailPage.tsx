import { Navigate, useSearchParams } from "react-router";

/**
 * Legacy path from older emails (`/verify?token=…`). Canonical route is `/verify-email?token=…`.
 */
export function VerifyEmailPage() {
  const [sp] = useSearchParams();
  const token = sp.get("token")?.trim() ?? "";
  const suffix = token ? `?token=${encodeURIComponent(token)}` : "";
  return <Navigate to={`/verify-email${suffix}`} replace />;
}

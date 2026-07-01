import { Navigate } from "react-router";

/** Legacy KYC route — not exposed in MVP; send managers to the dashboard. */
export function PendingVerification() {
  return <Navigate to="/dashboard" replace />;
}

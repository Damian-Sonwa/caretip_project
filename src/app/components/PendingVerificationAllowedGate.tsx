import { Outlet } from "react-router";

/** Business dashboard shell — does not gate on verification status. */
export function PendingVerificationAllowedGate() {
  return <Outlet />;
}

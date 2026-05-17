import { Navigate } from "react-router";

/** @deprecated Use `/dashboard/settings` — kept for bookmarks and legacy routes. */
export function ProfileSettingsPage() {
  return <Navigate to="/dashboard/settings?section=general" replace />;
}

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../hooks/useAuth';

interface RoleProtectedRouteProps {
  allowedRoles: Array<'business' | 'employee'>;
  children: ReactNode;
}

/**
 * Requires an authenticated user whose role matches allowedRoles.
 * Prevents employees from opening business URLs (and vice versa) via manual navigation.
 */
export function RoleProtectedRoute({ allowedRoles, children }: RoleProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const r = user.role as UserRole;

  const mustVerifyEmail =
    user.emailVerified === false && (r === "business" || r === "employee");

  if (mustVerifyEmail) {
    return <Navigate to="/check-email" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles.includes(r as 'business' | 'employee')) {
    return <>{children}</>;
  }

  if (r === 'platform_admin' || r === 'admin') {
    return <Navigate to="/platform-admin/dashboard" replace />;
  }
  if (r === 'business') {
    return <Navigate to="/dashboard" replace />;
  }
  if (r === 'employee') {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
}

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import type { User, UserRole } from '../hooks/useAuth';

interface RoleProtectedRouteProps {
  allowedRoles: Array<'business' | 'employee'>;
  children: ReactNode;
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('caretip_user');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/** Prefer onboarding completion from localStorage when hook state lags (multi-instance useAuth). */
function mergeOnboardingFromStorage(hookUser: User): User {
  if (hookUser.role !== 'business') return hookUser;
  const stored = readStoredUser();
  if (!stored || stored.id !== hookUser.id) return hookUser;
  return {
    ...hookUser,
    hasCompletedOnboarding:
      hookUser.hasCompletedOnboarding === true || stored.hasCompletedOnboarding === true,
  };
}

/**
 * Requires an authenticated user whose role matches allowedRoles.
 * Prevents employees from opening business URLs (and vice versa) via manual navigation.
 */
export function RoleProtectedRoute({ allowedRoles, children }: RoleProtectedRouteProps) {
  const { user, refreshSession } = useAuth();
  const location = useLocation();
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('caretip_token')) {
          await refreshSession();
        }
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  if (!sessionChecked) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const effectiveUser = mergeOnboardingFromStorage(user);
  const r = effectiveUser.role as UserRole;

  const mustVerifyEmail =
    effectiveUser.isVerified === false && (r === "business" || r === "employee");

  if (mustVerifyEmail) {
    return <Navigate to="/verify-email" replace state={{ from: location.pathname }} />;
  }

  // Onboarding gate for business users.
  if (r === "business") {
    const onOnboardingRoute = location.pathname === "/onboarding";
    if (effectiveUser.hasCompletedOnboarding === false && !onOnboardingRoute) {
      return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
    }
    if (effectiveUser.hasCompletedOnboarding === true && onOnboardingRoute) {
      return <Navigate to="/dashboard" replace />;
    }
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

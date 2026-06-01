import {
  clearBusinessStatsClientCache,
  clearEmployeeAccountClientCache,
  clearEmployeeProfileClientCache,
  clearEmployeeTipsClientCache,
} from "./api";
import { clearAllPageSessionCache } from "./pageSessionCache";
import { clearSubscriptionTierSession } from "./subscriptionSessionCache";
import { clearBusinessDashboardSwrStore } from "../hooks/useBusinessDashboardStats";
import { clearEmployeePeriodSwrStore } from "../hooks/useEmployeeDashboardAnalytics";
import { clearEmployeeAccountSwrStore } from "../hooks/useEmployeeAccountSummary";

/**
 * Wipe in-memory session caches on logout and account switch.
 * Prevents cross-account dashboard / profile data from persisting in the SPA.
 */
export function resetAllClientSessionCaches(): void {
  clearBusinessStatsClientCache();
  clearEmployeeTipsClientCache();
  clearEmployeeAccountClientCache();
  clearEmployeeProfileClientCache();
  clearAllPageSessionCache();
  clearSubscriptionTierSession();
  clearBusinessDashboardSwrStore();
  clearEmployeePeriodSwrStore();
  clearEmployeeAccountSwrStore();
}

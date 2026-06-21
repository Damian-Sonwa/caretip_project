import {
  getEmployeeById,
  getStaffByBusinessEmployeeSlug,
  getStaffBySlug,
} from "./api";

export type ResolvedCustomerEmployee = {
  businessId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  businessName: string;
  businessLogo: string | null;
};

type ResolveOpts = {
  employeeId: string;
  returnSlug?: string | null;
  returnBusinessSlug?: string | null;
  returnEmployeeSlug?: string | null;
  fallbackTeamMemberLabel: string;
  fallbackVenueLabel: string;
};

/** Single staff/employee resolution for the guest tip journey (guard + hydration). */
export async function resolveCustomerEmployeeContext(
  opts: ResolveOpts,
): Promise<ResolvedCustomerEmployee> {
  const {
    employeeId,
    returnSlug,
    returnBusinessSlug,
    returnEmployeeSlug,
    fallbackTeamMemberLabel,
    fallbackVenueLabel,
  } = opts;

  if (returnBusinessSlug?.trim() && returnEmployeeSlug?.trim()) {
    const s = await getStaffByBusinessEmployeeSlug(
      returnBusinessSlug.trim(),
      returnEmployeeSlug.trim(),
    );
    return {
      businessId: s.businessId,
      employeeId: s.id,
      employeeName: s.name,
      employeeAvatar: s.avatar ?? undefined,
      businessName: s.businessName,
      businessLogo: s.businessLogo ?? null,
    };
  }

  if (returnSlug?.trim()) {
    const s = await getStaffBySlug(returnSlug.trim());
    return {
      businessId: s.businessId,
      employeeId: s.id,
      employeeName: s.name,
      employeeAvatar: s.avatar ?? undefined,
      businessName: s.businessName,
      businessLogo: s.businessLogo ?? null,
    };
  }

  const emp = await getEmployeeById(employeeId);
  return {
    businessId: emp.businessId,
    employeeId: emp.id,
    employeeName: emp.name ?? fallbackTeamMemberLabel,
    employeeAvatar: emp.avatar ?? undefined,
    businessName: String(emp.businessName ?? "").trim() || fallbackVenueLabel,
    businessLogo: emp.businessLogo ?? null,
  };
}

export function isCustomerEmployeeContextReady(
  employeeId: string | null | undefined,
  ctx: {
    businessId: string | null;
    employeeId: string | null;
    employeeName: string | null;
  },
): boolean {
  if (!employeeId?.trim()) return false;
  return Boolean(
    ctx.businessId &&
      ctx.employeeId === employeeId &&
      ctx.employeeName?.trim(),
  );
}

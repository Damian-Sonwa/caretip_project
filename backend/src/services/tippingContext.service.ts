import { prisma } from "../prisma.js";

export interface PublicTippingEmployee {
  id: string;
  name: string;
  slug: string | null;
  jobTitle: string;
  avatar: string | null;
}

export interface PublicLocationContext {
  business: { id: string; name: string; slug: string | null };
  location: { id: string; name: string; description: string | null };
  employees: PublicTippingEmployee[];
}

export interface PublicTableContext {
  business: { id: string; name: string; slug: string | null };
  location: { id: string; name: string };
  table: { id: string; name: string; qrSlug: string };
  employees: PublicTippingEmployee[];
}

export type PublicTippingContextResult<T> = T | { locked: true };

const publicEmployeeSelect = {
  id: true,
  name: true,
  slug: true,
  jobTitle: true,
  avatar: true,
} as const;

async function listActiveEmployeesForBusiness(businessId: string): Promise<PublicTippingEmployee[]> {
  return prisma.employee.findMany({
    where: {
      businessId,
      isActive: true,
      activationStatus: "active",
      user: { is: { emailVerified: true } },
    },
    orderBy: { name: "asc" },
    select: publicEmployeeSelect,
  });
}

/** When no one has location assignments yet, keep showing all active staff (legacy behavior). */
async function employeesForLocationQr(
  businessId: string,
  locationId: string
): Promise<PublicTippingEmployee[]> {
  const assigned = await prisma.employee.findMany({
    where: {
      businessId,
      isActive: true,
      activationStatus: "active",
      locationId,
      user: { is: { emailVerified: true } },
    },
    orderBy: { name: "asc" },
    select: publicEmployeeSelect,
  });
  if (assigned.length > 0) return assigned;
  const anyWithLocation = await prisma.employee.count({
    where: {
      businessId,
      locationId: { not: null },
      activationStatus: "active",
      isActive: true,
      user: { is: { emailVerified: true } },
    },
  });
  if (anyWithLocation === 0) return listActiveEmployeesForBusiness(businessId);
  return [];
}

/** When no one has table assignments yet, keep showing all active staff (legacy behavior). */
async function employeesForTableQr(businessId: string, tableId: string): Promise<PublicTippingEmployee[]> {
  const assigned = await prisma.employee.findMany({
    where: {
      businessId,
      isActive: true,
      activationStatus: "active",
      tableAssignments: { some: { tableId } },
      user: { is: { emailVerified: true } },
    },
    orderBy: { name: "asc" },
    select: publicEmployeeSelect,
  });
  if (assigned.length > 0) return assigned;
  const anyWithTable = await prisma.employee.count({
    where: {
      businessId,
      activationStatus: "active",
      isActive: true,
      tableAssignments: { some: {} },
      user: { is: { emailVerified: true } },
    },
  });
  if (anyWithTable === 0) return listActiveEmployeesForBusiness(businessId);
  return [];
}

/** Public guest flow: location QR — team list for that business at this venue. */
export async function getPublicLocationContext(
  locationId: string
): Promise<PublicTippingContextResult<PublicLocationContext> | null> {
  const loc = await prisma.location.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      name: true,
      description: true,
      businessId: true,
      business: { select: { id: true, name: true, slug: true, verificationStatus: true } },
    },
  });
  if (!loc) return null;
  if (loc.business.verificationStatus !== "verified") return { locked: true };

  const employees = await employeesForLocationQr(loc.businessId, loc.id);
  return {
    business: { id: loc.business.id, name: loc.business.name, slug: loc.business.slug },
    location: { id: loc.id, name: loc.name, description: loc.description },
    employees,
  };
}

/** Public guest flow: table QR by primary key (parallel to slug-based /api/tipping-context/:qrSlug). */
export async function getPublicTableContextById(
  tableId: string
): Promise<PublicTippingContextResult<PublicTableContext> | null> {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    select: {
      id: true,
      name: true,
      qrSlug: true,
      locationId: true,
      location: {
        select: {
          id: true,
          name: true,
          businessId: true,
          business: { select: { id: true, name: true, slug: true, verificationStatus: true } },
        },
      },
    },
  });
  if (!table) return null;
  if (table.location.business.verificationStatus !== "verified") return { locked: true };

  const employees = await employeesForTableQr(table.location.businessId, table.id);
  return {
    business: {
      id: table.location.business.id,
      name: table.location.business.name,
      slug: table.location.business.slug,
    },
    location: { id: table.location.id, name: table.location.name },
    table: { id: table.id, name: table.name, qrSlug: table.qrSlug },
    employees,
  };
}

import { prisma } from "../prisma.js";
import { emitBusinessDataChanged } from "../socket/socketEmitters.js";

export async function listLocationsForBusinessUser(userId: string) {
  const business = await prisma.business.findUnique({ where: { userId } });
  if (!business) {
    throw new Error("Business not found");
  }
  return prisma.location.findMany({
    where: { businessId: business.id },
    orderBy: { name: "asc" },
  });
}

export async function createLocationForBusinessUser(
  userId: string,
  name: string,
  description?: string | null
) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Location name is required");
  }
  const business = await prisma.business.findUnique({ where: { userId } });
  if (!business) {
    throw new Error("Business not found");
  }
  const desc = description?.trim();
  const loc = await prisma.location.create({
    data: {
      name: trimmed,
      businessId: business.id,
      ...(desc ? { description: desc } : {}),
    },
  });
  emitBusinessDataChanged(business.id, "location_created");
  return loc;
}

export async function assertLocationOwnedByBusiness(locationId: string, businessId: string) {
  const loc = await prisma.location.findFirst({
    where: { id: locationId, businessId },
  });
  if (!loc) {
    throw new Error("Location not found");
  }
  return loc;
}

import { prisma } from "../prisma.js";
import {
  assertPlanLimitForBusiness,
  planLimitExceededPayload,
  resolveSubscriptionEntitlements,
} from "./subscriptionEntitlement.service.js";
import { emitBusinessDataChanged } from "../socket/socketEmitters.js";
import { invalidateBusinessStatsCache } from "./business.service.js";

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
  const business = await prisma.business.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!business) {
    throw new Error("Business not found");
  }
  const entitlements = await resolveSubscriptionEntitlements(business.id);
  if (!entitlements.hasActiveEntitlements) {
    throw new Error("An active subscription is required to manage locations.");
  }
  const count = await prisma.location.count({ where: { businessId: business.id } });
  const limitCheck = await assertPlanLimitForBusiness(business.id, "locations", count);
  if (!limitCheck.ok) {
    const payload = planLimitExceededPayload("locations", limitCheck.tier);
    throw new Error(payload.message);
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
  invalidateBusinessStatsCache(business.id);
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

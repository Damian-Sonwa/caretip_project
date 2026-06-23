import { BusinessSubscriptionTier } from "@prisma/client";
import { prisma } from "../prisma.js";
import { BASIC_MAX_LOCATIONS } from "../config/subscriptionCapabilities.js";
import { hasFeatureForTier } from "./subscriptionEntitlement.service.js";
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
    select: { id: true, subscriptionTier: true },
  });
  if (!business) {
    throw new Error("Business not found");
  }
  const tier = business.subscriptionTier ?? BusinessSubscriptionTier.basic;
  if (!hasFeatureForTier(tier, "multiLocation")) {
    const count = await prisma.location.count({ where: { businessId: business.id } });
    if (count >= BASIC_MAX_LOCATIONS) {
      throw new Error("Your plan supports one location. Upgrade to Premium for multi-location support.");
    }
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

import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";

const VERIFICATION_REQUIRED_MSG = "QR code generation will be enabled after admin verification.";

/**
 * GET /api/staff/directory/business/:slug
 * Public: active employees for a business (team / directory QR).
 */
export async function listActiveEmployeesByBusinessSlug(req: Request, res: Response) {
  try {
    const raw = req.params.slug?.trim().toLowerCase();
    if (!raw) {
      return res.status(400).json({ message: "Slug is required" });
    }
    const business = await prisma.business.findFirst({
      where: { slug: raw },
      select: { id: true, name: true, slug: true, verificationStatus: true },
    });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    if (business.verificationStatus !== "verified") {
      return res.status(403).json({ message: VERIFICATION_REQUIRED_MSG });
    }
    const employees = await prisma.employee.findMany({
      where: { businessId: business.id, isActive: true, activationStatus: "active" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        jobTitle: true,
        avatar: true,
      },
    });
    return res.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
      },
      employees,
    });
  } catch (err) {
    logServerError("staff.listActiveEmployeesByBusinessSlug", err);
    return res.status(500).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.staff),
    });
  }
}

type StaffBySlugRow = {
  id: string;
  name: string;
  slug: string | null;
  avatar: string | null;
  jobTitle: string;
  bio?: string | null;
  monthlyGoal?: unknown;
  businessId: string;
  business: { id: string; name: string; verificationStatus?: "pending" | "verified" | "rejected" };
};

async function findActiveStaffBySlug(trimmedSlug: string): Promise<StaffBySlugRow | null> {
  const full = {
    id: true,
    name: true,
    slug: true,
    avatar: true,
    jobTitle: true,
    bio: true,
    monthlyGoal: true,
    businessId: true,
    business: { select: { id: true, name: true, verificationStatus: true } },
  } as const;
  try {
    return prisma.employee.findFirst({
      where: { slug: trimmedSlug, isActive: true, activationStatus: "active" },
      select: full,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
      return prisma.employee.findFirst({
        where: { slug: trimmedSlug, isActive: true, activationStatus: "active" },
        select: {
          id: true,
          name: true,
          slug: true,
          avatar: true,
          jobTitle: true,
          businessId: true,
          business: { select: { id: true, name: true, verificationStatus: true } },
        },
      });
    }
    throw e;
  }
}

/**
 * GET /api/staff/:slug
 * Public: Find employee by slug for direct tipping links (e.g. /staff/john-doe)
 */
export async function getStaffBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    if (!slug?.trim()) {
      return res.status(400).json({ message: "Slug is required" });
    }
    const employee = await findActiveStaffBySlug(slug.trim());
    if (!employee) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    if (employee.business.verificationStatus && employee.business.verificationStatus !== "verified") {
      return res.status(403).json({ message: VERIFICATION_REQUIRED_MSG });
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthTips = await prisma.transaction.findMany({
      where: {
        employeeId: employee.id,
        status: "success",
        createdAt: { gte: startOfMonth },
      },
      select: { amount: true },
    });
    const currentMonthTotal = monthTips.reduce((s, t) => s + Number(t.amount), 0);

    const monthlyGoal =
      employee.monthlyGoal != null && employee.monthlyGoal !== undefined
        ? Number(employee.monthlyGoal)
        : null;

    return res.json({
      id: employee.id,
      name: employee.name,
      slug: employee.slug,
      avatar: employee.avatar,
      jobTitle: employee.jobTitle,
      bio: employee.bio ?? null,
      monthlyGoal,
      currentMonthTotal,
      businessId: employee.businessId,
      businessName: employee.business.name,
    });
  } catch (err) {
    logServerError("staff.getStaffBySlug", err);
    return res.status(500).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.staff),
    });
  }
}

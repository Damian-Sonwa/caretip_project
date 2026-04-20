import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../prisma.js";

let io: Server | null = null;

/** Maps socket.id → userId for observability (optional). */
const socketUserMap = new Map<string, string>();

interface JwtLike {
  userId?: string;
  id?: string;
  email?: string;
  role: Role;
}

export function getSocketIO(): Server | null {
  return io;
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    connectionStateRecovery: {},
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      const publicBusinessId = socket.handshake.auth.businessId as string | undefined;
      const publicSlug = socket.handshake.auth.businessSlug as string | undefined;

      if (!token) {
        if (publicBusinessId && typeof publicBusinessId === "string") {
          const b = await prisma.business.findUnique({
            where: { id: publicBusinessId },
            select: { id: true },
          });
          if (!b) return next(new Error("Invalid business"));
          socket.data.publicBusinessId = b.id;
          socket.data.isPublic = true;
          return next();
        }
        if (publicSlug && typeof publicSlug === "string") {
          const b = await prisma.business.findFirst({
            where: { slug: publicSlug },
            select: { id: true },
          });
          if (!b) return next(new Error("Invalid business"));
          socket.data.publicBusinessId = b.id;
          socket.data.isPublic = true;
          return next();
        }
        return next(new Error("Unauthorized"));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error("Server misconfigured"));
      }
      const decoded = jwt.verify(token, secret) as JwtLike;
      const userId = decoded.userId ?? decoded.id;
      if (!userId) {
        return next(new Error("Unauthorized"));
      }

      socket.data.userId = userId;
      socket.data.role = decoded.role;

      if (decoded.role === "EMPLOYEE") {
        const emp = await prisma.employee.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!emp) {
          return next(new Error("Forbidden"));
        }
        socket.data.employeeId = emp.id;
      } else if (decoded.role === "MANAGER") {
        const biz = await prisma.business.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!biz) {
          return next(new Error("Forbidden"));
        }
        socket.data.businessId = biz.id;
      } else if (decoded.role === "SUPER_ADMIN") {
        const row = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, isPlatformAdmin: true, isActive: true },
        });
        if (
          !row ||
          row.role !== Role.SUPER_ADMIN ||
          !row.isPlatformAdmin ||
          !row.isActive
        ) {
          return next(new Error("Forbidden"));
        }
        socket.data.isPlatformAdmin = true;
      } else {
        return next(new Error("Forbidden"));
      }

      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.isPublic) {
      const bid = socket.data.publicBusinessId as string;
      socket.join(`public:business:${bid}`);
      return;
    }

    const userId = socket.data.userId as string;
    socketUserMap.set(socket.id, userId);

    if (socket.data.employeeId) {
      socket.join(`employee:${socket.data.employeeId}`);
    }
    if (socket.data.businessId) {
      socket.join(`business:${socket.data.businessId}`);
    }
    if (socket.data.isPlatformAdmin) {
      socket.join("platform");
    }

    socket.on("disconnect", () => {
      socketUserMap.delete(socket.id);
    });
  });

  return io;
}

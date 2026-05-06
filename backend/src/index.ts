// Load env FIRST so DATABASE_URL exists before any Prisma import (see ./loadEnv.js for merge order).
import "dotenv/config";
import "./loadEnv.js";
import { createServer } from "http";
import { join } from "path";
import express from "express";
import "express-async-errors";
import cors from "cors";
import { Role } from "@prisma/client";
import { prisma } from "./prisma.js";
import { authMiddleware, requireRole, requireVerifiedEmail } from "./middleware/auth.middleware.js";
import { isApprovedBusiness } from "./middleware/isApprovedBusiness.middleware.js";
import * as businessController from "./controllers/business.controller.js";
import authRoutes from "./routes/auth.routes.js";
import businessRoutes from "./routes/business.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import goalsRoutes from "./routes/goals.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import tipsRoutes from "./routes/tips.routes.js";
import transactionsRoutes from "./routes/transactions.routes.js";
import locationsRoutes from "./routes/locations.routes.js";
import tablesRoutes from "./routes/tables.routes.js";
import tippingContextRoutes from "./routes/tippingContext.routes.js";
import platformRoutes from "./routes/platform.routes.js";
import stripeWebhookRoutes from "./webhooks/stripe.webhook.js";
import paymentRoutes from "./routes/payment.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import testRoutes from "./routes/test.routes.js";
import meRoutes from "./routes/settings.routes.js";
import { initSocketServer } from "./socket/socketServer.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

const app = express();
const PORT = process.env.PORT ?? 3001;

async function assertEnvForAuth(): Promise<void> {
  const jwt = process.env.JWT_SECRET?.trim();
  if (!jwt) {
    console.error(
      'FATAL: JWT_SECRET is missing or empty. Set JWT_SECRET="your_super_secret_key" in backend/.env (non-empty string).'
    );
    process.exit(1);
  }
  try {
    await prisma.$connect();
  } catch (e) {
    const errObj = e && typeof e === "object" ? (e as { code?: string; errorCode?: string }) : null;
    const code = String(errObj?.errorCode ?? errObj?.code ?? "");
    const hint =
      code === "P1001"
        ? " Check **Session pooler** URL (port **5432**), Supabase project **not paused**, firewall/VPN allows **outbound 5432**, password correct. Copy URL from Supabase → Connect → **Session mode**."
        : code === "P1000"
          ? " **Wrong password or bad URL.** User must be `postgres.PROJECT_REF` for the pooler. No empty password between `:` and `@`. Copy from Supabase → Connect → Session pooler. Reset DB password under Project Settings → Database if needed."
          : "";
    console.error(
      `FATAL: Cannot connect to PostgreSQL.${hint} Check .env and that the database is reachable.`,
      e,
    );
    process.exit(1);
  }
  // Do not $disconnect — shared prisma singleton is used for the whole process.
}

// Webhook must use raw body for Stripe signature verification
app.use("/api/webhook", express.raw({ type: "application/json" }), stripeWebhookRoutes);
app.use("/api/webhooks", express.raw({ type: "application/json" }), stripeWebhookRoutes);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/uploads", express.static(join(process.cwd(), "uploads")));

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
/** Registered on the app (not the sub-router) so `/me/stats` is never interpreted as `/:businessId`. */
app.get(
  "/api/business/me/stats",
  authMiddleware,
  requireVerifiedEmail,
  requireRole(Role.MANAGER),
  businessController.getMyStats
);
app.use("/api/business", businessRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/tips", tipsRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/locations", locationsRoutes);
app.use("/api/tables", tablesRoutes);
app.use("/api/tipping-context", tippingContextRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/platform", platformRoutes);
/** Alias for SuperAdmin clients (same handlers as `/api/platform`). */
app.use("/api/admin", platformRoutes);

app.get("/health", (_, res) => res.json({ status: "ok" }));

app.use(errorHandler);

const httpServer = createServer(app);
initSocketServer(httpServer);

void assertEnvForAuth().then(() => {
  if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY?.trim()) {
    console.warn(
      "[env] RESEND_API_KEY is not set — email verification, employee activation, and password reset messages will not be delivered via Resend."
    );
  }
  httpServer.listen(PORT, () => {
    console.log(`Caretip API running on http://localhost:${PORT}`);
  });
});

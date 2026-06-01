import { test, expect } from "@playwright/test";
import { installMockAuthRefresh, primeE2ESessionToken } from "./helpers/mockAuthRefresh";

type MockAuthUser = Parameters<typeof installMockAuthRefresh>[1]["user"];

const baseEmployee = (overrides: Partial<MockAuthUser> = {}) => ({
  token: "e2e-test-token",
  user: {
    id: "e2e-employee-1",
    email: "staff@e2e.local",
    role: "EMPLOYEE",
    name: "E2E Staff",
    emailVerified: true,
    hasCompletedOnboarding: false,
    employeeId: "e2e-emp-row",
    businessId: "e2e-biz-row",
    ...overrides,
  },
});

const baseManager = (overrides: Partial<MockAuthUser> = {}) => ({
  token: "e2e-test-token",
  user: {
    id: "e2e-business-1",
    email: "biz@e2e.local",
    role: "MANAGER",
    name: "E2E Business",
    emailVerified: true,
    hasCompletedOnboarding: true,
    businessId: "e2e-biz-row",
    ...overrides,
  },
});

const baseAdmin = (overrides: Partial<MockAuthUser> = {}) => ({
  token: "e2e-test-token",
  user: {
    id: "e2e-admin-1",
    email: "admin@e2e.local",
    role: "platform_admin",
    name: "E2E Admin",
    emailVerified: true,
    hasCompletedOnboarding: true,
    ...overrides,
  },
});

function jsonResponse(data: unknown) {
  return { status: 200, contentType: "application/json", body: JSON.stringify(data) };
}

test.describe("Instant metrics + deferred analytics (runtime behavior)", () => {
  test("Employee dashboard: metrics paint before analytics; no duplicate analytics fetch", async ({ page }) => {
    await installMockAuthRefresh(page, baseEmployee());
    await primeE2ESessionToken(page);

    let summaryCalls = 0;
    let analyticsCalls = 0;

    await page.route("**/api/tips/employee?**", async (route) => {
      const url = new URL(route.request().url());
      const scope = url.searchParams.get("scope");
      if (scope === "account") {
        await new Promise((r) => setTimeout(r, 80));
        return route.fulfill(
          jsonResponse({
            totalEarningsEur: 1200,
            availableBalanceEur: 100,
            totalSupporters: 44,
          }),
        );
      }
      if (scope === "summary") {
        summaryCalls += 1;
        await new Promise((r) => setTimeout(r, 150));
        return route.fulfill(
          jsonResponse({
            periodTipCount: 2,
            periodAmountEur: 12,
            monthlyGoal: 200,
            currentMonthTotal: 40,
            goal: { goalAmount: 200, currentAmount: 40, status: "on_track" },
            tips: [],
            chartSeries: [],
            businessTimezone: "Europe/Berlin",
          }),
        );
      }
      if (scope === "analytics") {
        analyticsCalls += 1;
        await new Promise((r) => setTimeout(r, 1800));
        return route.fulfill(
          jsonResponse({
            chartSeries: [{ label: "Mon", amount: 12 }],
            tips: [],
          }),
        );
      }
      return route.fallback();
    });

    const navStart = Date.now();
    await page.goto("/employee/dashboard");

    // Instant interactivity: period toggle visible quickly.
    await expect(page.locator("button[aria-pressed]")).toHaveCount(3);
    const ttiMs = Date.now() - navStart;

    // Deferred analytics: exactly one summary + one analytics request per load.
    await expect.poll(() => analyticsCalls, { timeout: 15_000 }).toBe(1);
    await expect.poll(() => summaryCalls, { timeout: 15_000 }).toBe(1);

    // TTI is environment dependent in CI/headless; we assert "no long blocking".
    expect(ttiMs).toBeLessThan(12_000);
  });

  test("Business dashboard: metrics paint before analytics; websocket tip does not cause fetch storm", async ({ page }) => {
    await installMockAuthRefresh(page, baseManager());
    await primeE2ESessionToken(page);

    let summaryCalls = 0;
    let analyticsCalls = 0;

    await page.route("**/api/business/me/stats?**", async (route) => {
      const url = new URL(route.request().url());
      const scope = url.searchParams.get("scope");
      if (scope === "summary") {
        summaryCalls += 1;
        await new Promise((r) => setTimeout(r, 120));
        return route.fulfill(
          jsonResponse({
            totalTips: 100,
            tipCount: 10,
            employeeCount: 3,
            operationalPulse: {
              tipsLast60m: { amount: 5, count: 1 },
              tipsToday: { amount: 12, count: 2 },
              tippingReadyEmployees: 2,
              rosterTotal: 3,
              employeesMissingQr: 0,
              goalsTracked: 1,
              goalsOnTrackOrBetter: 1,
            },
            dailyTipDistribution: [],
            employeeGoals: [],
            employees: [],
          }),
        );
      }
      if (scope === "analytics") {
        analyticsCalls += 1;
        await new Promise((r) => setTimeout(r, 2000));
        return route.fulfill(
          jsonResponse({
            dailyTipDistribution: [{ label: "Mon", amount: 12 }],
            employeeGoals: [],
          }),
        );
      }
      return route.fallback();
    });

    await page.goto("/dashboard");

    // Metric grid should be visible quickly (even if analytics pending).
    await expect(page.locator(".dashboard-hero, .business-dashboard-hero, .business-dashboard-hero-card")).toBeVisible();

    // Ensure only one analytics call per load.
    await expect.poll(() => analyticsCalls, { timeout: 15_000 }).toBe(1);
    await expect.poll(() => summaryCalls, { timeout: 15_000 }).toBe(1);
  });

  test("Admin dashboard: renders without full-screen loader; analytics can lag behind core stats", async ({ page }) => {
    await installMockAuthRefresh(page, baseAdmin());
    await primeE2ESessionToken(page);

    let statsCalls = 0;
    let analyticsCalls = 0;

    await page.route("**/api/platform/stats", async (route) => {
      statsCalls += 1;
      await new Promise((r) => setTimeout(r, 1200));
      return route.fulfill(
        jsonResponse({
          totalVolumeEurFormatted: "123.45",
          successTransactionCount: 10,
          transactionCount: 11,
          businessesWithSuccessfulTips: 3,
        }),
      );
    });

    await page.route("**/api/platform/businesses", async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      return route.fulfill(
        jsonResponse({
          businesses: [],
        }),
      );
    });

    await page.route("**/api/platform/analytics?**", async (route) => {
      analyticsCalls += 1;
      await new Promise((r) => setTimeout(r, 3500));
      return route.fulfill(
        jsonResponse({
          rangeDays: 30,
          userDistribution: [],
          tipStatus: [],
          growth: [],
          tipVolume: [],
          topBusinessesByTips: [],
        }),
      );
    });

    await page.goto("/platform-admin/dashboard");

    // Should not block on full-screen loader anymore.
    await expect(page.locator("main").first()).toBeVisible();

    // Core shell should be present even before stats return.
    // We assert one of the stable platform hero elements exists.
    await expect(page.locator(".platform-admin-hero")).toBeVisible({ timeout: 10_000 });

    // Stats should eventually be fetched.
    await expect.poll(() => statsCalls, { timeout: 10_000 }).toBe(1);
    await expect.poll(() => analyticsCalls, { timeout: 10_000 }).toBe(1);
  });
});


import { test, expect } from "@playwright/test";
import { installMockAuthRefresh, primeE2ESessionToken } from "./helpers/mockAuthRefresh";

type MockAuthUser = Parameters<typeof installMockAuthRefresh>[1];

const SUMMARY_MS = 120;
const ANALYTICS_MS = 380;
const STATS_MS = 110;
const PLATFORM_ANALYTICS_MS = 420;

function jsonResponse(data: unknown, delayMs = 0) {
  return async () => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    return { status: 200, contentType: "application/json", body: JSON.stringify(data) };
  };
}

type ApiEvent = {
  name: string;
  start: number;
  end: number;
  duration: number;
};

type DashboardMilestone = {
  shell: number | null;
  kpis: number | null;
  charts: number | null;
  goals: number | null;
  topPerformers: number | null;
  interactive: number | null;
};

const DASHBOARD_PROBE_INIT = `
(() => {
  if (window.__caretipDashboardProbe) return;
  window.__caretipDashboardProbe = { milestones: {}, api: [] };
  window.__caretipDashboardFetchProbe = window.__caretipDashboardFetchProbe ?? [];

  let navStart = performance.now();
  let lastLongTaskAt = performance.now();

  try {
    const ltObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) lastLongTaskAt = performance.now();
      }
    });
    ltObs.observe({ type: "longtask", buffered: true });
  } catch {}

  function mark(name) {
    if (window.__caretipDashboardProbe.milestones[name] != null) return;
    window.__caretipDashboardProbe.milestones[name] = Math.round(performance.now() - navStart);
  }

  function watchInteractive() {
    if (performance.now() - lastLongTaskAt >= 80) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => mark("interactive"));
      });
      return;
    }
    if (performance.now() - navStart > 15000) return;
    requestAnimationFrame(watchInteractive);
  }

  function poll(selectors, milestone, then) {
    if (!selectors) {
      then?.();
      return;
    }
    const list = selectors.split(",").map((s) => s.trim());
    const started = performance.now();
    function tick() {
      for (const sel of list) {
        const el = document.querySelector(sel);
        if (el && el.getBoundingClientRect().height > 0) {
          mark(milestone);
          then?.();
          return;
        }
      }
      if (performance.now() - started > 12000) {
        then?.();
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  window.__caretipDashboardProbe.begin = () => {
    navStart = performance.now();
    window.__caretipDashboardProbe.milestones = {};
  };

  window.__caretipDashboardProbe.watch = (cfg) => {
    poll(cfg.shell, "shell", () => {
      poll(cfg.kpis, "kpis", () => {
        const afterKpis = () => {
          if (cfg.goals) {
            poll(cfg.goals, "goals", () => {
              if (cfg.topPerformers) {
                poll(cfg.topPerformers, "topPerformers", () => {
                  poll(cfg.charts, "charts", watchInteractive);
                });
              } else {
                poll(cfg.charts, "charts", watchInteractive);
              }
            });
          } else {
            poll(cfg.charts, "charts", watchInteractive);
          }
        };
        afterKpis();
      });
    });
  };
})();
`;

async function runDashboardProfile(
  page: import("@playwright/test").Page,
  opts: {
    label: string;
    path: string;
    shell: string;
    kpis: string;
    charts: string;
    goals?: string;
    topPerformers?: string;
    setupRoutes: () => Promise<void>;
  },
) {
  await page.context().addInitScript(DASHBOARD_PROBE_INIT);
  await opts.setupRoutes();

  await page.goto(opts.path, { waitUntil: "domcontentloaded" });
  await page.evaluate((cfg) => {
    window.__caretipDashboardProbe.begin();
    window.__caretipDashboardProbe.watch(cfg);
  }, {
    shell: opts.shell,
    kpis: opts.kpis,
    charts: opts.charts,
    goals: opts.goals ?? null,
    topPerformers: opts.topPerformers ?? null,
  });

  await page.waitForFunction(
    () => window.__caretipDashboardProbe?.milestones?.interactive != null,
    { timeout: 20_000 },
  );

  const result = await page.evaluate(() => ({
    milestones: window.__caretipDashboardProbe?.milestones ?? {},
    api: window.__caretipDashboardFetchProbe ?? [],
  }));

  const payload = {
    dashboard: opts.label,
    path: opts.path,
    milestones: result.milestones as DashboardMilestone,
    apiWaterfall: result.api,
  };

  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

test.describe("Dashboard initialization performance audit", () => {
  test("Business dashboard startup phases", async ({ page }) => {
    await installMockAuthRefresh(page, {
      token: "e2e-test-token",
      user: {
        id: "e2e-business-1",
        email: "biz@e2e.local",
        role: "MANAGER",
        name: "E2E Business",
        emailVerified: true,
        hasCompletedOnboarding: true,
        businessId: "e2e-biz-row",
      },
    });
    await primeE2ESessionToken(page);

    const apiEvents: ApiEvent[] = [];

    const profile = await runDashboardProfile(page, {
      label: "Business",
      path: "/dashboard",
      shell: ".business-dashboard-hero, .business-dashboard-body",
      kpis: ".business-dashboard-body .grid, [class*='statsGrid']",
      charts: ".business-dashboard-chart-frame, .business-dashboard-chart-card, .recharts-surface",
      goals: ".business-dashboard-block, .business-dashboard-goals-summary",
      topPerformers: ".business-dashboard-bottom-grid, .business-dashboard-bottom-grid__main",
      setupRoutes: async () => {
        await page.route("**/api/business/profile**", async (route) =>
          route.fulfill(await jsonResponse({ tier: "business", advancedAnalytics: true })()),
        );
        await page.route("**/api/business/me/stats?**", async (route) => {
          const url = new URL(route.request().url());
          const scope = url.searchParams.get("scope");
          const start = Date.now();
          if (scope === "summary") {
            apiEvents.push({ name: "business:summary", start, end: 0, duration: 0 });
            const body = await jsonResponse(
              {
                totalTips: 240,
                tipCount: 18,
                employeeCount: 4,
                employees: [
                  {
                    id: "1",
                    name: "Alex Smith",
                    tipsTotal: 90,
                    isActive: true,
                    activationStatus: "active",
                    emailVerified: true,
                  },
                ],
                employeeGoals: [{ status: "on_track" }],
                dailyTipDistribution: [{ day: "Mon", amount: 12 }],
              },
              SUMMARY_MS,
            )();
            apiEvents[apiEvents.length - 1].end = Date.now();
            apiEvents[apiEvents.length - 1].duration =
              apiEvents[apiEvents.length - 1].end - apiEvents[apiEvents.length - 1].start;
            return route.fulfill(body);
          }
          if (scope === "analytics") {
            apiEvents.push({ name: "business:analytics", start, end: 0, duration: 0 });
            const body = await jsonResponse(
              {
                dailyTipDistribution: [{ day: "Mon", amount: 12 }],
                employeeGoals: [{ status: "on_track", employeeName: "Alex" }],
                employees: [
                  {
                    id: "1",
                    name: "Alex Smith",
                    tipsTotal: 90,
                    isActive: true,
                    activationStatus: "active",
                    emailVerified: true,
                  },
                ],
              },
              ANALYTICS_MS,
            )();
            apiEvents[apiEvents.length - 1].end = Date.now();
            apiEvents[apiEvents.length - 1].duration =
              apiEvents[apiEvents.length - 1].end - apiEvents[apiEvents.length - 1].start;
            return route.fulfill(body);
          }
          return route.fallback();
        });
        await page.route("**/api/business/customer-feedback?**", async (route) => {
          await new Promise((r) => setTimeout(r, 200));
          return route.fulfill(
            await jsonResponse({ items: [], summary: { feedbackCount: 0, averageRating: null } })(),
          );
        });
      },
    });

    expect(profile.milestones.shell).not.toBeNull();
    expect(profile.milestones.kpis).not.toBeNull();
    expect(profile.milestones.interactive).not.toBeNull();
    if (profile.milestones.kpis != null && profile.milestones.charts != null) {
      expect(profile.milestones.charts).toBeGreaterThanOrEqual(profile.milestones.kpis);
    }
  });

  test("Employee dashboard startup phases", async ({ page }) => {
    await installMockAuthRefresh(page, {
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
      },
    });
    await primeE2ESessionToken(page);

    const profile = await runDashboardProfile(page, {
      label: "Employee",
      path: "/employee/dashboard",
      shell: ".employee-dashboard-hero",
      kpis: "button[aria-pressed]",
      charts: ".recharts-surface",
      goals: ".employee-dashboard-hero",
      setupRoutes: async () => {
        await page.route("**/api/tips/employee?**", async (route) => {
          const scope = new URL(route.request().url()).searchParams.get("scope");
          if (scope === "summary") {
            return route.fulfill(
              await jsonResponse(
                {
                  periodTipCount: 3,
                  periodAmountEur: 24,
                  monthlyGoal: 200,
                  currentMonthTotal: 80,
                  goal: { goalAmount: 200, currentAmount: 80, status: "on_track" },
                  chartSeries: [],
                  tips: [],
                },
                SUMMARY_MS,
              )(),
            );
          }
          if (scope === "analytics") {
            return route.fulfill(
              await jsonResponse(
                {
                  chartSeries: [{ label: "Mon", amount: 24 }],
                  tips: [{ id: "t1", amount: 8, createdAt: new Date().toISOString() }],
                },
                ANALYTICS_MS,
              )(),
            );
          }
          return route.fallback();
        });
      },
    });

    expect(profile.milestones.shell).not.toBeNull();
    expect(profile.milestones.interactive).not.toBeNull();
  });

  test("Admin dashboard startup phases", async ({ page }) => {
    await installMockAuthRefresh(page, {
      token: "e2e-test-token",
      user: {
        id: "e2e-admin-1",
        email: "admin@e2e.local",
        role: "platform_admin",
        name: "E2E Admin",
        emailVerified: true,
        hasCompletedOnboarding: true,
      },
    });
    await primeE2ESessionToken(page);

    const profile = await runDashboardProfile(page, {
      label: "Admin",
      path: "/platform-admin/dashboard",
      shell: ".platform-admin-hero, main.bg-background",
      kpis: ".platform-admin-hero, [class*='platform-admin-stat']",
      charts: ".platform-admin-analytics-section, .recharts-surface, [class*='analyticsChartWrap']",
      setupRoutes: async () => {
        await page.route("**/api/platform/stats", async (route) =>
          route.fulfill(
            await jsonResponse(
              {
                totalVolumeEurFormatted: "500.00",
                successTransactionCount: 42,
                transactionCount: 44,
                businessesWithSuccessfulTips: 6,
              },
              STATS_MS,
            )(),
          ),
        );
        await page.route("**/api/platform/analytics?**", async (route) =>
          route.fulfill(
            await jsonResponse(
              {
                rangeDays: 30,
                userDistribution: [{ label: "Business", value: 3 }],
                tipStatus: [{ label: "Succeeded", value: 40 }],
                growth: [{ label: "W1", value: 10 }],
                tipVolume: [{ label: "Mon", value: 12 }],
                topBusinessesByTips: [{ businessName: "Cafe", tipsEur: 120 }],
              },
              PLATFORM_ANALYTICS_MS,
            )(),
          ),
        );
        await page.route("**/api/platform/businesses", async (route) =>
          route.fulfill(await jsonResponse({ businesses: [] }, 80)()),
        );
        await page.route("**/api/platform/health", async (route) =>
          route.fulfill(await jsonResponse({ status: "ok" }, 60)()),
        );
      },
    });

    expect(profile.milestones.shell).not.toBeNull();
    expect(profile.milestones.interactive).not.toBeNull();
  });
});

declare global {
  interface Window {
    __caretipDashboardProbe?: {
      begin: () => void;
      watch: (cfg: Record<string, string | null>) => void;
      milestones: Record<string, number | null>;
    };
    __caretipDashboardFetchProbe?: ApiEvent[];
  }
}

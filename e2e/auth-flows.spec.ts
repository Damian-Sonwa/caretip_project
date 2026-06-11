import { test, expect } from "@playwright/test";
import { installMockAuthRefresh, primeE2ESessionToken, type MockAuthRefreshBody } from "./helpers/mockAuthRefresh";

const baseManager = (overrides: Partial<MockAuthRefreshBody["user"]> = {}): MockAuthRefreshBody => ({
  token: "e2e-test-token",
  user: {
    id: "e2e-business-1",
    email: "biz@e2e.local",
    role: "MANAGER",
    name: "E2E Business",
    emailVerified: true,
    hasCompletedOnboarding: true,
    businessId: "e2e-biz-row",
    businessVerificationStatus: "verified",
    ...overrides,
  },
});

const baseEmployee = (overrides: Partial<MockAuthRefreshBody["user"]> = {}): MockAuthRefreshBody => ({
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

test.describe("Auth routing (guards + mocked refresh)", () => {
  test("Test 2a: unauthenticated /dashboard → /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Test 1 step: unverified business /dashboard → /verify-email", async ({ page }) => {
    await installMockAuthRefresh(
      page,
      baseManager({ emailVerified: false, hasCompletedOnboarding: false }),
    );
    await primeE2ESessionToken(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/verify-email/);
  });

  test("Test 1 step: verified business without onboarding /dashboard → /onboarding", async ({ page }) => {
    await installMockAuthRefresh(
      page,
      baseManager({ emailVerified: true, hasCompletedOnboarding: false }),
    );
    await primeE2ESessionToken(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test("Test 5: completed onboarding cannot reopen /onboarding", async ({ page }) => {
    await installMockAuthRefresh(
      page,
      baseManager({ emailVerified: true, hasCompletedOnboarding: true }),
    );
    await primeE2ESessionToken(page);
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("Test 3a: unverified employee /employee/dashboard → /verify-email", async ({ page }) => {
    await installMockAuthRefresh(page, baseEmployee({ emailVerified: false }));
    await primeE2ESessionToken(page);
    await page.goto("/employee/dashboard");
    await expect(page).toHaveURL(/\/verify-email/);
  });

  test("Test 3b: verified employee /dashboard → /employee/dashboard", async ({ page }) => {
    await installMockAuthRefresh(page, baseEmployee({ emailVerified: true }));
    await primeE2ESessionToken(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/employee\/dashboard/);
  });

  test("Test 4: check-email page (no token) shows verify copy", async ({ page }) => {
    await page.goto("/verify-email");
    await expect(
      page.getByRole("heading", {
        name: /Check your email to verify your account|Bitte E-Mail prüfen, um Ihr Konto zu bestätigen/i,
      }),
    ).toBeVisible({ timeout: 15_000 });
  });
});

import type { Page } from "@playwright/test";

/** Minimal shape accepted by `persistAuthResponse` / `parseUser` (matches `AuthResponse`). */
export type MockAuthRefreshBody = {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    emailVerified?: boolean;
    hasCompletedOnboarding?: boolean;
    businessId?: string;
    employeeId?: string;
    businessVerificationStatus?: "pending" | "verified" | "rejected";
  };
};

export async function installMockAuthRefresh(page: Page, body: MockAuthRefreshBody): Promise<void> {
  await page.route("**/api/auth/refresh", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

export async function primeE2ESessionToken(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("caretip_token", "e2e-test-token");
  });
}

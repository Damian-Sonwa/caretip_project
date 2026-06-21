import { test, expect } from "@playwright/test";

/**
 * Validates customer routes skip auth bootstrap overlay (isPublicShellPath).
 */
test.describe("Customer public shell paths", () => {
  test("customer routes do not show auth bootstrap overlay", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __caretipAuthOverlaySeen?: boolean }).__caretipAuthOverlaySeen = false;
      const obs = new MutationObserver(() => {
        const overlay = document.querySelector('.app-setup-loading.fixed[aria-busy="true"]');
        if (overlay) {
          (window as unknown as { __caretipAuthOverlaySeen: boolean }).__caretipAuthOverlaySeen = true;
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    });

    const paths = [
      "/tip-amount?employeeId=test-emp",
      "/payment?employeeId=test-emp&amount=10",
      "/rating?session_id=test-session",
      "/tip-complete?session_id=test-session",
      "/qr-landing/test-biz",
      "/qr/employee/test-emp",
      "/harbor-kitchen",
      "/harbor-kitchen/alex-server",
    ];

    for (const path of paths) {
      await page.route("**/api/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "mock", name: "Mock", businessId: "mock-biz", employees: [] }),
        });
      });

      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      const overlaySeen = await page.evaluate(
        () => (window as unknown as { __caretipAuthOverlaySeen?: boolean }).__caretipAuthOverlaySeen ?? false,
      );
      expect(overlaySeen, `auth overlay on ${path}`).toBe(false);
    }
  });
});

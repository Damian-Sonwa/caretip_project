import { test, expect } from "@playwright/test";

const OUT_DIR = "test-results/customer-journey-header";

test.describe("Customer journey brand hierarchy", () => {
  test("tip amount header leads with venue name", async ({ page }) => {
    await page.route("**/api/staff/brand-demo", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "emp-header",
          name: "Anna Müller",
          jobTitle: "Server",
          businessId: "biz-1",
          businessName: "Café Sonnenschein",
          businessLogo: null,
          avatar: null,
          bio: null,
          slug: "brand-demo",
        }),
      });
    });

    await page.route("**/api/employees/emp-header**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "emp-header",
          name: "Anna Müller",
          businessId: "biz-1",
          businessName: "Café Sonnenschein",
          businessLogo: null,
          avatar: null,
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem("caretip_i18n_language", "en");
    });

    await page.goto("/staff/brand-demo", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/tip-amount/, { timeout: 15_000 });

    await expect(page.getByRole("heading", { level: 1, name: "Café Sonnenschein" })).toBeVisible();
    await expect(page.getByText(/choose tip amount for/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/anna müller/i)).toBeVisible();
    await expect(page.getByText(/powered by caretip/i)).toBeVisible();

    await page.screenshot({ path: `${OUT_DIR}/brand-tip-amount-375px.png`, fullPage: false });
  });

  test("qr landing header leads with business name", async ({ page }) => {
    await page.route("**/api/business/biz-1**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "biz-1",
          name: "Café Sonnenschein",
          slug: "cafe",
          type: "Café",
          location: "Berlin",
          logo: null,
          employeeCount: 0,
        }),
      });
    });

    await page.goto("/qr-landing/biz-1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Café Sonnenschein" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/powered by caretip/i)).toBeVisible();

    await page.screenshot({ path: `${OUT_DIR}/brand-qr-landing-375px.png`, fullPage: false });
  });
});

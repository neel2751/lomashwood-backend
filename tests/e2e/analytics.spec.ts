import { test, expect } from "@playwright/test";

test.describe("Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/analytics");
  });

  test("displays analytics overview", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /analytics/i })).toBeVisible();
  });

  test("displays stats cards", async ({ page }) => {
    await expect(page.getByTestId("stats-card").first()).toBeVisible();
  });

  test("displays revenue chart", async ({ page }) => {
    await expect(page.getByTestId("revenue-chart")).toBeVisible();
  });

  test("displays tracking page", async ({ page }) => {
    await page.goto("/analytics/tracking");
    await expect(page.getByRole("heading", { name: /tracking/i })).toBeVisible();
  });

  test("displays funnels list", async ({ page }) => {
    await page.goto("/analytics/funnels");
    await expect(page.getByRole("heading", { name: /funnels/i })).toBeVisible();
  });

  test("navigates to new funnel", async ({ page }) => {
    await page.goto("/analytics/funnels/new");
    await expect(page.getByRole("heading", { name: /new funnel/i })).toBeVisible();
  });

  test("creates a new funnel", async ({ page }) => {
    await page.goto("/analytics/funnels/new");
    await page.getByLabel(/name/i).fill("Test Funnel");
    await page.getByRole("button", { name: /add step/i }).click();
    await page.getByPlaceholder(/step name/i).first().fill("Homepage Visit");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/funnel created/i)).toBeVisible();
  });

  test("displays custom dashboards list", async ({ page }) => {
    await page.goto("/analytics/dashboards");
    await expect(page.getByRole("heading", { name: /dashboards/i })).toBeVisible();
  });

  test("navigates to new dashboard", async ({ page }) => {
    await page.goto("/analytics/dashboards/new");
    await expect(page.getByRole("heading", { name: /new dashboard/i })).toBeVisible();
  });

  test("displays exports page", async ({ page }) => {
    await page.goto("/analytics/exports");
    await expect(page.getByRole("heading", { name: /exports/i })).toBeVisible();
  });

  test("date range filter updates charts", async ({ page }) => {
    await page.getByTestId("date-range-picker").click();
    await page.getByText(/last 30 days/i).click();
    await expect(page.getByTestId("revenue-chart")).toBeVisible();
  });
});
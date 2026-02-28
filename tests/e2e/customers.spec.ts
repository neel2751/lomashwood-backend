import { test, expect } from "@playwright/test";

test.describe("Customers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/customers");
  });

  test("displays customers list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /customers/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("searches customers", async ({ page }) => {
    await page.getByRole("searchbox").fill("John");
    await expect(page.getByText(/john/i).first()).toBeVisible();
  });

  test("navigates to customer detail", async ({ page }) => {
    await page.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/customers\/.+/);
    await expect(page.getByRole("heading", { name: /customer detail/i })).toBeVisible();
  });

  test("displays customer timeline", async ({ page }) => {
    await page.getByRole("link").first().click();
    await expect(page.getByTestId("customer-timeline")).toBeVisible();
  });

  test("displays reviews list", async ({ page }) => {
    await page.goto("/customers/reviews");
    await expect(page.getByRole("heading", { name: /customer reviews/i })).toBeVisible();
  });

  test("moderates a review", async ({ page }) => {
    await page.goto("/customers/reviews");
    await page.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/customers\/reviews\/.+/);
    await page.getByRole("combobox", { name: /status/i }).selectOption("approved");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/review updated/i)).toBeVisible();
  });

  test("displays support tickets", async ({ page }) => {
    await page.goto("/customers/support");
    await expect(page.getByRole("heading", { name: /support tickets/i })).toBeVisible();
  });

  test("filters support tickets by status", async ({ page }) => {
    await page.goto("/customers/support");
    await page.getByRole("combobox", { name: /status/i }).selectOption("open");
    await expect(page.getByText(/open/i).first()).toBeVisible();
  });

  test("displays loyalty programme", async ({ page }) => {
    await page.goto("/customers/loyalty");
    await expect(page.getByRole("heading", { name: /loyalty/i })).toBeVisible();
  });
});
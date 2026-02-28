import { test, expect } from "@playwright/test";

test.describe("Orders", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/orders");
  });

  test("displays orders list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("filters orders by status", async ({ page }) => {
    await page.getByRole("combobox", { name: /status/i }).selectOption("pending");
    await expect(page.getByText(/pending/i).first()).toBeVisible();
  });

  test("navigates to order detail", async ({ page }) => {
    await page.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/orders\/.+/);
    await expect(page.getByRole("heading", { name: /order detail/i })).toBeVisible();
  });

  test("updates order status", async ({ page }) => {
    await page.getByRole("link").first().click();
    await page.getByRole("combobox", { name: /status/i }).selectOption("confirmed");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/order updated/i)).toBeVisible();
  });

  test("displays payments list", async ({ page }) => {
    await page.goto("/orders/payments");
    await expect(page.getByRole("heading", { name: /payments/i })).toBeVisible();
  });

  test("displays invoices list", async ({ page }) => {
    await page.goto("/orders/invoices");
    await expect(page.getByRole("heading", { name: /invoices/i })).toBeVisible();
  });

  test("navigates to new refund form", async ({ page }) => {
    await page.goto("/orders/refunds/new");
    await expect(page.getByRole("heading", { name: /new refund/i })).toBeVisible();
  });

  test("displays refunds list", async ({ page }) => {
    await page.goto("/orders/refunds");
    await expect(page.getByRole("heading", { name: /refunds/i })).toBeVisible();
  });
});
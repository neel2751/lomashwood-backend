import { test, expect } from "@playwright/test";

test.describe("Products", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products");
  });

  test("displays products list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /products/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("filters products by category", async ({ page }) => {
    await page.getByRole("combobox", { name: /category/i }).selectOption("kitchen");
    await expect(page.getByText(/kitchen/i).first()).toBeVisible();
  });

  test("navigates to new product form", async ({ page }) => {
    await page.getByRole("link", { name: /new product/i }).click();
    await expect(page).toHaveURL("/products/new");
    await expect(page.getByRole("heading", { name: /new product/i })).toBeVisible();
  });

  test("creates a new product", async ({ page }) => {
    await page.goto("/products/new");
    await page.getByLabel(/title/i).fill("Test Kitchen Unit");
    await page.getByLabel(/description/i).fill("A test kitchen product");
    await page.getByRole("combobox", { name: /category/i }).selectOption("kitchen");
    await page.getByLabel(/range name/i).fill("Test Range");
    await page.getByLabel(/price/i).fill("999");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/product created/i)).toBeVisible();
  });

  test("navigates to product detail", async ({ page }) => {
    await page.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/products\/.+/);
  });

  test("displays product categories", async ({ page }) => {
    await page.goto("/products/categories");
    await expect(page.getByRole("heading", { name: /categories/i })).toBeVisible();
  });

  test("displays product colours", async ({ page }) => {
    await page.goto("/products/colours");
    await expect(page.getByRole("heading", { name: /colours/i })).toBeVisible();
  });

  test("displays product sizes", async ({ page }) => {
    await page.goto("/products/sizes");
    await expect(page.getByRole("heading", { name: /sizes/i })).toBeVisible();
  });

  test("displays inventory", async ({ page }) => {
    await page.goto("/products/inventory");
    await expect(page.getByRole("heading", { name: /inventory/i })).toBeVisible();
  });

  test("displays pricing", async ({ page }) => {
    await page.goto("/products/pricing");
    await expect(page.getByRole("heading", { name: /pricing/i })).toBeVisible();
  });
});
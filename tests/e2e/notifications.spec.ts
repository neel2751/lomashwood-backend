import { test, expect } from "@playwright/test";

test.describe("Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/notifications");
  });

  test("displays notifications overview", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("displays email notifications log", async ({ page }) => {
    await page.goto("/notifications/email");
    await expect(page.getByRole("heading", { name: /email notifications/i })).toBeVisible();
  });

  test("displays email notification detail", async ({ page }) => {
    await page.goto("/notifications/email");
    await page.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/notifications\/email\/.+/);
    await expect(page.getByRole("heading", { name: /email notification detail/i })).toBeVisible();
  });

  test("displays SMS notifications log", async ({ page }) => {
    await page.goto("/notifications/sms");
    await expect(page.getByRole("heading", { name: /sms notifications/i })).toBeVisible();
  });

  test("displays push notifications log", async ({ page }) => {
    await page.goto("/notifications/push");
    await expect(page.getByRole("heading", { name: /push notifications/i })).toBeVisible();
  });

  test("displays notification templates", async ({ page }) => {
    await page.goto("/notifications/templates");
    await expect(page.getByRole("heading", { name: /notification templates/i })).toBeVisible();
  });

  test("navigates to new template form", async ({ page }) => {
    await page.goto("/notifications/templates/new");
    await expect(page.getByRole("heading", { name: /new notification template/i })).toBeVisible();
  });

  test("creates a new notification template", async ({ page }) => {
    await page.goto("/notifications/templates/new");
    await page.getByLabel(/name/i).fill("Test Template");
    await page.getByRole("combobox", { name: /channel/i }).selectOption("email");
    await page.getByLabel(/subject/i).fill("Test Subject");
    await page.getByLabel(/body/i).fill("Hello {{name}}, this is a test.");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/template created/i)).toBeVisible();
  });

  test("filters notifications by channel", async ({ page }) => {
    await page.getByRole("combobox", { name: /channel/i }).selectOption("email");
    await expect(page.getByText(/email/i).first()).toBeVisible();
  });
});
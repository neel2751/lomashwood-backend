import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("displays login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation errors for empty form submission", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/email/i)).toBeVisible();
    await expect(page.getByText(/password/i)).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test("redirects to dashboard on successful login", async ({ page }) => {
    await page.getByLabel(/email/i).fill(process.env.TEST_ADMIN_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/login/);
  });

  test("forgot password page loads", async ({ page }) => {
    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("logs out and redirects to login", async ({ page }) => {
    await page.getByLabel(/email/i).fill(process.env.TEST_ADMIN_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.TEST_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
    await page.getByRole("button", { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
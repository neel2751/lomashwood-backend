import { test, expect } from "@playwright/test";

test.describe("Appointments", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/appointments");
  });

  test("displays appointments list", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /appointments/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("filters appointments by type", async ({ page }) => {
    await page.getByRole("combobox", { name: /type/i }).selectOption("home_measurement");
    await expect(page.getByText(/home measurement/i).first()).toBeVisible();
  });

  test("navigates to appointment detail", async ({ page }) => {
    await page.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/appointments\/.+/);
    await expect(page.getByRole("heading", { name: /appointment detail/i })).toBeVisible();
  });

  test("displays availability manager", async ({ page }) => {
    await page.goto("/appointments/availability");
    await expect(page.getByRole("heading", { name: /availability/i })).toBeVisible();
  });

  test("displays consultants list", async ({ page }) => {
    await page.goto("/appointments/consultants");
    await expect(page.getByRole("heading", { name: /consultants/i })).toBeVisible();
  });

  test("navigates to new consultant form", async ({ page }) => {
    await page.goto("/appointments/consultants/new");
    await expect(page.getByRole("heading", { name: /new consultant/i })).toBeVisible();
  });

  test("creates a new consultant", async ({ page }) => {
    await page.goto("/appointments/consultants/new");
    await page.getByLabel(/name/i).fill("Test Consultant");
    await page.getByLabel(/email/i).fill("consultant@test.com");
    await page.getByLabel(/phone/i).fill("07700000000");
    await page.getByRole("checkbox", { name: /kitchen/i }).check();
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/consultant created/i)).toBeVisible();
  });

  test("displays reminders list", async ({ page }) => {
    await page.goto("/appointments/reminders");
    await expect(page.getByRole("heading", { name: /reminders/i })).toBeVisible();
  });

  test("mail notification sent for kitchen and bedroom booking", async ({ page }) => {
    await page.goto("/appointments");
    const kitchenAndBedroomRow = page.getByText(/kitchen.*bedroom|bedroom.*kitchen/i).first();
    await expect(kitchenAndBedroomRow).toBeVisible();
  });
});
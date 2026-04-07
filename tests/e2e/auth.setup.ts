import { test } from "@playwright/test";

test("authenticate admin", async ({ page }) => {
  const email = `pw-admin-${Date.now()}@lomashwood.local`;
  const password = "PlaywrightAdmin123!";

  await page.goto("/register");
  await page.getByLabel(/full name/i).fill("Playwright Admin");
  await page.getByLabel(/email/i).fill(email);
  await page.locator("#password").fill(password);
  await page.getByLabel(/confirm password/i).fill(password);
  await page.getByRole("button", { name: /create admin/i }).click();
  await page.waitForURL("/");

  await page.context().storageState({ path: "tests/e2e/.auth/admin.json" });
});

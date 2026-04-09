import { test } from "@playwright/test";

test("authenticate admin", async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL ?? "admin@lomashwood.com";
  const password = process.env.TEST_ADMIN_PASSWORD ?? "admin12345";

  const authPaths = ["/login", "/auth/login", "/register", "/auth/register"];
  let resolvedPath: string | null = null;

  for (const path of authPaths) {
    await page.goto(path);

    const hasEmailInput = (await page.locator('input[name="email"]').count()) > 0;
    if (hasEmailInput) {
      resolvedPath = path;
      break;
    }
  }

  if (!resolvedPath) {
    throw new Error("No supported auth route found for Playwright setup.");
  }

  const isRegisterRoute = resolvedPath.includes("register");

  if (isRegisterRoute) {
    const setupEmail = `pw-admin-${Date.now()}@lomashwood.local`;
    await page.getByLabel(/full name/i).fill("Playwright Admin");
    await page.getByLabel(/email/i).fill(setupEmail);
    await page.locator("#password").fill("PlaywrightAdmin123!");
    await page.getByLabel(/confirm password/i).fill("PlaywrightAdmin123!");
    await page.getByRole("button", { name: /create admin/i }).click();
  } else {
    await page.getByLabel(/email/i).fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
  }

  await page.waitForURL("/");

  await page.context().storageState({ path: "tests/e2e/.auth/admin.json" });
});

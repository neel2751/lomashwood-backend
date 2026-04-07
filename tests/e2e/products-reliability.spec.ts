import { expect, test } from "@playwright/test";

test.describe("Products Reliability", () => {
  test("loads product option dependencies on create and edit flows", async ({ page }) => {
    await page.goto("/products/new");

    await expect(page.getByRole("heading", { name: /add product/i })).toBeVisible();
    await expect(page.getByLabel(/category/i)).toBeVisible();
    await expect(page.getByLabel(/style/i)).toBeVisible();
    await expect(page.getByLabel(/finish/i)).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);

    await page.goto("/products/categories");
    await expect(page.getByRole("heading", { name: /categories/i })).toBeVisible();
    await expect(page.getByText(/failed to load categories\./i)).toHaveCount(0);

    await page.goto("/products/colours");
    await expect(page.getByRole("heading", { name: /products/i })).toBeVisible();
    await expect(page.getByText(/failed to load colours\./i)).toHaveCount(0);

    await page.goto("/products/projects");
    await expect(page.getByRole("heading", { name: /projects/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/failed to load projects\./i)).toHaveCount(0);

    await page.goto("/products");
    const editLinks = page.locator('a[href^="/products/"][href$="/edit"]');
    const editCount = await editLinks.count();

    if (editCount > 0) {
      await editLinks.first().click();
      await expect(page.getByRole("heading", { name: /edit/i })).toBeVisible();
      await expect(page.getByLabel(/style/i)).toBeVisible();
      await expect(page.getByLabel(/finish/i)).toBeVisible();
      await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
    }
  });
});

import { test, expect } from "@playwright/test";

test.describe("Content", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/content");
  });

  test("displays content overview", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /content/i })).toBeVisible();
  });

  test("displays blogs list", async ({ page }) => {
    await page.goto("/content/blogs");
    await expect(page.getByRole("heading", { name: /blogs/i })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("navigates to new blog form", async ({ page }) => {
    await page.goto("/content/blogs/new");
    await expect(page.getByRole("heading", { name: /new blog/i })).toBeVisible();
  });

  test("creates a new blog post", async ({ page }) => {
    await page.goto("/content/blogs/new");
    await page.getByLabel(/title/i).fill("Test Blog Post");
    await page.getByLabel(/slug/i).fill("test-blog-post");
    await page.getByLabel(/excerpt/i).fill("A short excerpt");
    await page.getByLabel(/content/i).fill("Full blog content here");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText(/blog.*created/i)).toBeVisible();
  });

  test("displays media wall", async ({ page }) => {
    await page.goto("/content/media-wall");
    await expect(page.getByRole("heading", { name: /media wall/i })).toBeVisible();
  });

  test("displays CMS pages", async ({ page }) => {
    await page.goto("/content/cms");
    await expect(page.getByRole("heading", { name: /cms pages/i })).toBeVisible();
  });

  test("navigates to new CMS page", async ({ page }) => {
    await page.goto("/content/cms/new");
    await expect(page.getByRole("heading", { name: /new cms page/i })).toBeVisible();
  });

  test("displays SEO settings", async ({ page }) => {
    await page.goto("/content/seo");
    await expect(page.getByRole("heading", { name: /seo/i })).toBeVisible();
  });

  test("displays landing pages", async ({ page }) => {
    await page.goto("/content/landing-pages");
    await expect(page.getByRole("heading", { name: /landing pages/i })).toBeVisible();
  });

  test("navigates to new landing page", async ({ page }) => {
    await page.goto("/content/landing-pages/new");
    await expect(page.getByRole("heading", { name: /new landing page/i })).toBeVisible();
  });
});
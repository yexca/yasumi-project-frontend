import { expect, test } from "@playwright/test";

test("redirects the root route to Today", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();
});

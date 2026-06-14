import { expect, test } from "@playwright/test";

import { seedAuthSession } from "./helpers";

test("redirects the root route to Today", async ({ page }) => {
  await seedAuthSession(page);
  await page.goto("/");

  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { level: 2, name: "Today" })).toBeVisible();
});

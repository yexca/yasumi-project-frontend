import { expect, test } from "@playwright/test";

import { seedAuthSession } from "./helpers";

test("keeps Today dense rows compact without horizontal overflow", async ({ page }) => {
  await seedAuthSession(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/today");

  await expect(page.getByRole("heading", { level: 2, name: "Today" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quick Add" })).toBeVisible();

  const normalRow = page.locator("article.surface-row", { hasText: "Draft roadmap update" });
  await expect(normalRow).toBeVisible();
  const normalRowBox = await normalRow.boundingBox();
  expect(normalRowBox?.height).toBeLessThanOrEqual(52);

  const recommendedRow = page.locator("article.surface-row", { hasText: "Send renewal decision" });
  await expect(recommendedRow).toBeVisible();
  const recommendedRowBox = await recommendedRow.boundingBox();
  expect(recommendedRowBox?.height).toBeLessThanOrEqual(80);

  const desktopOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(desktopOverflow).toBe(false);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const mobileOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(mobileOverflow).toBe(false);
  await expect(page.getByLabel("Quick Add")).toBeVisible();
});

import { expect, test } from "@playwright/test";

import { seedAuthSession, seedAuthSessionForContext } from "./helpers";

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("navigates every MVP page from the shell", async ({ page }) => {
  await seedAuthSession(page);
  await page.goto("/today");

  for (const pageName of [
    "Inbox",
    "Upcoming",
    "Deadlines",
    "Idea Pool",
    "Areas",
    "Completed",
    "Archive",
    "Settings",
    "Today",
  ]) {
    await page.getByRole("link", { name: pageName, exact: true }).click();
    await expect(page.getByRole("heading", { level: 2, name: pageName })).toBeVisible();
  }
});

test("Quick Add creates a local capture and shows pending sync state", async ({ page }) => {
  await seedAuthSession(page);
  await page.goto("/inbox");

  await page.getByRole("button", { name: "Quick Add" }).click();
  await page.getByLabel("Source text").fill("call venue tomorrow");
  await expect(page.locator("dd", { hasText: "call venue" })).toBeVisible();
  await expect(page.getByText("Date task")).toBeVisible();
  await page.getByRole("button", { name: "Save as Inbox" }).click();

  await expect(page.getByText("call venue tomorrow")).toBeVisible();
  await expect(page.getByRole("button", { name: /Saved on this device/ }).first()).toBeVisible();
  await expect(
    page.locator("article.surface-row", { hasText: "call venue tomorrow" }),
  ).toContainText("Saved on this device");
});

test("a normal item can be completed and reopened", async ({ page }) => {
  await seedAuthSession(page);
  await page.goto("/today");

  const row = page.locator("article.surface-row", { hasText: "Draft roadmap update" });
  await row.getByRole("button", { name: "Complete" }).click();
  await expect(page.getByRole("status")).toContainText("Completed");
  await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();

  await page.getByRole("link", { name: "Completed" }).click();
  await expect(
    page.locator("article.surface-row", { hasText: "Draft roadmap update" }),
  ).toBeVisible();

  await page
    .locator("article.surface-row", { hasText: "Draft roadmap update" })
    .getByRole("button", { name: "Reopen" })
    .click();
  await expect(
    page.locator("article.surface-row", { hasText: "Draft roadmap update" }),
  ).toBeHidden();

  await page.getByRole("link", { name: "Today" }).click();
  await expect(
    page.locator("article.surface-row", { hasText: "Draft roadmap update" }),
  ).toBeVisible();
});

test("offline local edit remains navigable and pending", async ({ page, context }) => {
  await seedAuthSession(page);
  await page.goto("/today");
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));

  await expect(page.getByRole("button", { name: "Offline" }).first()).toBeVisible();
  const row = page.locator("article.surface-row", { hasText: "Send renewal decision" });
  await row.getByRole("button", { name: "Complete" }).click();
  await expect(page.getByRole("button", { name: /Offline/ }).first()).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Completed");

  await page.getByRole("link", { name: "Inbox" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inbox" })).toBeVisible();
});

test("settings switch language, theme, and local background without diagnostics", async ({
  page,
}) => {
  await seedAuthSession(page);
  await page.goto("/settings");

  await page.getByLabel("Language", { exact: true }).selectOption("zh-Hans");
  await expect(page.getByRole("heading", { level: 2, name: "设置" })).toBeVisible();

  await page.getByLabel("主题").getByText("深色").click();
  await expect(page.locator(".theme-root")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".theme-root")).toHaveAttribute("data-theme-mode", "dark");

  await page.getByRole("button", { name: "重置" }).click();
  await expect(page.locator(".theme-root")).toHaveAttribute("data-background", "none");
  await expect(page.locator(".theme-root")).toHaveAttribute("data-background-preference", "none");
});

test("unsupported browser language falls back to English", async ({ browser }) => {
  const context = await browser.newContext({ locale: "fr-FR" });
  await seedAuthSessionForContext(context);
  const page = await context.newPage();

  await page.goto("/settings");
  await expect(page.getByRole("heading", { level: 2, name: "Settings" })).toBeVisible();
  await expect(page.getByLabel("Language", { exact: true })).toHaveValue("en");

  await context.close();
});

import type { BrowserContext, Page } from "@playwright/test";

export async function seedAuthSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "yasumi:auth-session",
      JSON.stringify({
        accessToken: "e2e-access-token",
        expiresAt: "2099-01-01T00:00:00Z",
        refreshToken: "e2e-refresh-token",
        user: {
          id: "e2e-user",
          username: "e2e-user",
          email: "e2e-user@example.com",
          display_name: "E2E User",
        },
      }),
    );
  });
}

export async function seedAuthSessionForContext(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    window.localStorage.setItem(
      "yasumi:auth-session",
      JSON.stringify({
        accessToken: "e2e-access-token",
        expiresAt: "2099-01-01T00:00:00Z",
        refreshToken: "e2e-refresh-token",
        user: {
          id: "e2e-user",
          username: "e2e-user",
          email: "e2e-user@example.com",
          display_name: "E2E User",
        },
      }),
    );
  });
}

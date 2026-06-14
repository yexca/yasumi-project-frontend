import { defineConfig, devices } from "@playwright/test";

const npmCommand = process.platform === "win32" ? ".\\env\\npm.cmd" : "npm";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  webServer: {
    command: `${npmCommand} run dev -- --port 4175`,
    url: "http://127.0.0.1:4175",
    reuseExistingServer: true,
  },
  use: {
    baseURL: "http://127.0.0.1:4175",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

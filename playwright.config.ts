import {defineConfig, devices} from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const isExternalBaseURL = new URL(baseURL).protocol === "https:";
const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  (process.env.CI ? "pnpm start" : "pnpm dev");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 8_000
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: process.env.CI ? [["list"], ["html", {open: "never"}]] : "list",
  use: {
    baseURL,
    reducedMotion: "reduce",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"]}
    },
    {
      name: "mobile-chromium",
      use: {...devices["Pixel 7"]}
    }
  ],
  webServer: {
    command: webServerCommand,
    url: new URL("/sr", baseURL).toString(),
    reuseExistingServer: !process.env.CI || isExternalBaseURL,
    timeout: 120_000
  }
});

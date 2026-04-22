import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression: compares full-page screenshots to committed baselines.
 * Update baselines locally: npm run test:visual:update
 *
 * Default web server runs `scripts/playwright-visual-stack.sh` (backend + build + preview)
 * so logged-in feature screens can reach the API. Requires a valid `apps/backend/.env`
 * (DATABASE_URL, JWT secrets, etc.).
 *
 * Preview-only (no API): PLAYWRIGHT_PREVIEW_ONLY=1 npm run test:visual
 * Reuse servers already listening on 4173 (you must start backend + preview yourself):
 * PLAYWRIGHT_REUSE_SERVER=1 npm run test:visual
 */
export default defineConfig({
  testDir: "./tests/visual",
  // Omit OS from filenames so the same baselines work on Linux CI and dev machines.
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 900 },
    locale: "es-MX",
    colorScheme: "light",
    reducedMotion: "reduce",
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    launchOptions: {
      args: ["--font-render-hinting=none", "--disable-skia-runtime-opts"],
    },
  },
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixels: 200,
      threshold: 0.25,
    },
  },
  webServer: {
    command:
      process.env.PLAYWRIGHT_PREVIEW_ONLY === "1"
        ? "npm run build && vite preview --host 127.0.0.1 --port 4173 --strictPort"
        : "bash scripts/playwright-visual-stack.sh",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === "1",
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});

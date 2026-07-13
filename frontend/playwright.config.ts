import { defineConfig } from "@playwright/test";

/* End-to-end tests against the full stack. Expects the app to be running:
 *   docker compose up -d            (from the repo root)
 *   .venv/bin/uvicorn app.main:app  (from backend/)
 *   npm run dev                     (from frontend/)
 * Then: npm run test:e2e
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // tests share the admin session/database
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    colorScheme: "light",
  },
});

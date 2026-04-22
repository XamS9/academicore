import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.int.test.ts"],
    setupFiles: [path.resolve(__dirname, "src/test/vitest.setup.ts")],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Integration tests share DB state; keep file order predictable.
    sequence: {
      concurrent: false,
    },
  },
});

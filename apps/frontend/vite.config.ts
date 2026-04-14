import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Monorepo root `.env` (VITE_*) — same file as backend; default Vite cwd is apps/frontend only.
const monorepoRoot = path.resolve(__dirname, "../..");

export default defineConfig({
  envDir: monorepoRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});

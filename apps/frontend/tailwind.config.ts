import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  important: "#root", // Required for MUI + Tailwind coexistence
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;

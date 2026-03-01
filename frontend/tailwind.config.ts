import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#090912",
        panel: "#121226",
        neon: "#a855f7",
        cyan: "#06b6d4"
      }
    }
  },
  plugins: []
};

export default config;

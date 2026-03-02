import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#111111",
        surface2: "#1a1a1a",
        cream: "#f5f3ef",
        muted: "#6b7280",
        violet: {
          DEFAULT: "#7c3aed",
          light: "#8b5cf6",
          hover: "#6d28d9",
          glow: "rgba(124,58,237,0.15)",
          border: "rgba(124,58,237,0.3)"
        },
        border: "rgba(255,255,255,0.08)"
      },
      borderRadius: {
        DEFAULT: "16px",
        sm: "8px",
        lg: "20px",
        xl: "24px",
        "2xl": "32px"
      },
      transitionDuration: {
        DEFAULT: "300ms"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-space)", "sans-serif"],
        space: ["var(--font-space)", "sans-serif"]
      },
      boxShadow: {
        violet: "0 0 24px rgba(124,58,237,0.2)",
        "violet-lg": "0 0 48px rgba(124,58,237,0.25)",
        soft: "0 4px 24px rgba(0,0,0,0.4)"
      },
      backgroundImage: {
        "violet-radial": "radial-gradient(circle at 80% -10%, rgba(124,58,237,0.12) 0%, transparent 60%)"
      }
    }
  },
  plugins: []
};

export default config;

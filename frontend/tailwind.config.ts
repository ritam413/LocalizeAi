import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0f19",
        surface: "#111827",
        surfaceBorder: "#1f293d",
        // Ditto Palette Tokens
        ditto: {
          deepInk: "#130e30",
          hiYellow: "#ffe228",
          mossGreen: "#59e25d",
          fuchsia: "#e261e5",
          slate: "#5f5c6e",
          canvas: "#f9fbf2",
          softMeadow: "#eff2e5",
          charcoal: "#222222",
          onyx: "#000000",
        },
        brand: {
          50: "#eef2ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        accent: {
          cyan: "#06b6d4",
          violet: "#8b5cf6",
          emerald: "#10b981",
          amber: "#f59e0b",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        netflix: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(99, 102, 241, 0.4)",
        yellowGlow: "0 0 0 3px #ffe228, 0 4px 16px rgba(19, 14, 48, 0.08)",
        fuchsiaGlow: "0 0 0 3px rgba(226, 97, 229, 0.35)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }
    },
  },
  plugins: [],
};
export default config;


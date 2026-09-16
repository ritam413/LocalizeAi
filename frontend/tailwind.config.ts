import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fbfbfd",
        surface: "#ffffff",
        surfaceBorder: "#dbd8e8",
        
        // Canonical Studio Design System Tokens (Extracted & Refined)
        studio: {
          primary: "#7248ea",
          primaryHover: "#6847ff",
          accent: "#6a33e9",
          soft: "#f2eeff",
          tint: "#f8f6ff",
          mint: "#00d4aa",
          ink: "#1a1a1a",
          black: "#07060c",
          muted: "#575268",
          subtle: "#9e9e9e",
          line: "#dbd8e8",
          borderFocus: "#bd98ec",
          canvas: "#fbfbfd",
          dark: "#111827",
          charcoal: "#171427",
        },
        
        // QA Continuity & Defect Status Colors
        qa: {
          success: "#14804a",
          successBg: "#f0f9eb",
          successBorder: "#c2e7b0",
          danger: "#b42318",
          dangerBg: "#fef0f0",
          dangerBorder: "#fde2e2",
          warning: "#a96f00",
          warningBg: "#fdf6ec",
          warningBorder: "#f5dab1",
          info: "#409eff",
          infoBg: "#ecf5ff",
          infoBorder: "#b3d8ff",
        },

        // Legacy / Backward-Compatible Theme Aliases
        ditto: {
          deepInk: "#1a1a1a",
          hiYellow: "#ffe228",
          mossGreen: "#00d4aa",
          fuchsia: "#7248ea",
          slate: "#575268",
          canvas: "#fbfbfd",
          softMeadow: "#f2eeff",
          charcoal: "#171427",
          onyx: "#07060c",
        },
        brand: {
          50: "#f8f6ff",
          100: "#f2eeff",
          500: "#7248ea",
          600: "#6847ff",
          700: "#6a33e9",
        },
        accent: {
          cyan: "#00d4aa",
          violet: "#7248ea",
          emerald: "#14804a",
          amber: "#a96f00",
        }
      },
      borderRadius: {
        'studio-sm': '6px',
        'studio-md': '10px',
        'studio-lg': '16px',
        'studio-xl': '20px',
      },
      boxShadow: {
        'studio-card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'studio-float': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'studio-modal': '0 20px 50px rgba(26, 20, 55, 0.12)',
        'studio-glow': '0 4px 14px rgba(114, 72, 234, 0.28)',
        'studio-glow-hover': '0 6px 20px rgba(114, 72, 234, 0.42)',
        glow: '0 4px 14px rgba(114, 72, 234, 0.28)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
      },
      fontFamily: {
        sans: ["Roboto", "Inter", "ui-sans-serif", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mintlify / Light-Blue Base Tokens
        canvas: "#F0F6FC",
        surface: "#FFFFFF",
        surfaceBorder: "#D0DFEE",
        ink: "#0F172A",
        signalBlue: "#2B7FFF",

        // Canonical Studio Design System Tokens
        studio: {
          primary: "#2B7FFF",       // Signal Blue
          primaryHover: "#1E6BDB",
          accent: "#7248EA",        // Studio Violet
          accentHover: "#6847FF",
          soft: "#F2EEFF",
          tint: "#F0F6FC",
          mint: "#00D4AA",
          ink: "#0F172A",
          slate: "#475569",
          muted: "#64748B",
          subtle: "#94A3B8",
          line: "#D0DFEE",
          borderFocus: "#2B7FFF",
          canvas: "#F0F6FC",
          dark: "#0F172A",
          charcoal: "#1E293B",
          black: "#07060C",
        },
        
        // QA Continuity & Defect Status Colors
        qa: {
          success: "#15803D",
          successBg: "#F0FDF4",
          successBorder: "#BBF7D0",
          danger: "#B91C1C",
          dangerBg: "#FEF2F2",
          dangerBorder: "#FECACA",
          warning: "#B45309",
          warningBg: "#FFFBEB",
          warningBorder: "#FDE68A",
          info: "#0369A1",
          infoBg: "#F0F9FF",
          infoBorder: "#BAE6FD",
        },

        // Legacy / Backward-Compatible Theme Aliases
        ditto: {
          deepInk: "#0F172A",
          hiYellow: "#FFE228",
          mossGreen: "#00D4AA",
          fuchsia: "#7248EA",
          slate: "#475569",
          canvas: "#F0F6FC",
          softMeadow: "#F0F6FC",
          charcoal: "#1E293B",
          onyx: "#07060C",
        },
        brand: {
          50: "#F0F6FC",
          100: "#E2EDF8",
          500: "#2B7FFF",
          600: "#1E6BDB",
          700: "#1454B8",
        },
        accent: {
          cyan: "#00D4AA",
          violet: "#7248EA",
          emerald: "#15803D",
          amber: "#B45309",
          blue: "#2B7FFF",
        }
      },
      borderRadius: {
        // Zero-Pill Geometry Tokens
        'btn': '4px',
        'tag': '4px',
        'card': '16px',
        'container': '24px',
        'studio-sm': '4px',
        'studio-md': '4px',
        'studio-lg': '16px',
        'studio-xl': '24px',
      },
      boxShadow: {
        'studio-card': '0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)',
        'studio-float': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'studio-modal': '0 20px 50px rgba(15, 23, 42, 0.12)',
        'studio-glow': '0 4px 14px rgba(43, 127, 255, 0.25)',
        'studio-glow-hover': '0 6px 20px rgba(43, 127, 255, 0.35)',
        glow: '0 4px 14px rgba(43, 127, 255, 0.25)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "ui-sans-serif", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;

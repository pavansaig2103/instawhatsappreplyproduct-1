import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08090f",
          900: "#0d1018",
          850: "#111622",
          800: "#161d2b",
          700: "#222b3d"
        },
        brand: {
          500: "#f260b7",
          600: "#8b165a"
        },
        mint: "#45e0a8",
        amber: "#f6b653"
      },
      boxShadow: {
        glow: "0 0 48px rgba(255, 79, 184, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d8edff",
          200: "#b7deff",
          300: "#85c9ff",
          400: "#4ca9ff",
          500: "#1f89ff",
          600: "#106ee6",
          700: "#1058b8",
          800: "#134b91",
          900: "#153f74"
        }
      }
    }
  },
  plugins: []
};

export default config;

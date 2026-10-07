import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8eb6ff",
          400: "#5a90ff",
          500: "#3568f5",
          600: "#2249e0",
          700: "#1c3abc",
          800: "#1c3399",
          900: "#1d307a",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16,24,40,0.05)",
        panel: "0 4px 24px -4px rgba(16,24,40,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;

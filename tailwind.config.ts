import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1280px", // Changed from default 1024px to 1280px
      xl: "1280px",
      "2xl": "1536px",
    },
  },
};

export default config;


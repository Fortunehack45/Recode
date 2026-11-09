/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        term: {
          bg: "#0b0e14",
          surface: "#121820",
          border: "#1e293b",
          cyan: "#00e5ff",
          green: "#00e676",
          yellow: "#ffd600",
          orange: "#ff9100",
          purple: "#d500f9",
          muted: "#64748b",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Cascadia Code",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

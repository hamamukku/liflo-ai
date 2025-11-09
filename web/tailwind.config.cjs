/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        liflo: {
          light: "#EAF7E9",
          paper: "#DFF0DF",
          accent: "#62B66E",
          accent700: "#2D8A54",
          border: "#B7D3BA",
          tab: "#E8EEF0",
        },
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06)",
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', "Roboto", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

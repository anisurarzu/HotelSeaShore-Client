/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./component/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./config/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        hs: {
          deep: "#04343a",
          ocean: "#0b5c66",
          lagoon: "#14919b",
          soft: "#3db5be",
          mist: "#e8f4f3",
          pearl: "#f7fbfa",
          sand: "#c9a66b",
          ink: "#142a2e",
          muted: "#5f7478",
        },
      },
    },
  },
  plugins: [],
};

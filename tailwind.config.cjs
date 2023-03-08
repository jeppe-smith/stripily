/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    {
      pattern:
        /^(bg|text|ring)-(|amber|cyan|emerald|fuchsia|indigo|pink|purple|rose|teal|violet)-(100|300|800)?/,
    },
  ],
  theme: {
    extend: {
      colors: {
        brand: "#403CF5",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

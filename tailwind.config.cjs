/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#403CF5",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

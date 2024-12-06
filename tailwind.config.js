/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        primary: ['Amaranth', 'sans-serif'],
        secondary: ['Sen', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
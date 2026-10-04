/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
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
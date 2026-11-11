/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#15B659',
        'brand-dark': '#0e9447',
        'brand-deep': '#0B7A3B',
        surface: '#F9FBFA',
        ink: '#0C1811',
        'ink-soft': '#14281D',
        sage: '#99BBA8',
        moss: '#4B644A',
        danger: '#B42318',
      },
      spacing: {
        nav: '4.5rem',
      },
      fontFamily: {
        primary: ['Amaranth', 'sans-serif'],
        secondary: ['Sen', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
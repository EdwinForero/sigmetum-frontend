/** @type {import('tailwindcss').Config} */
import { REVEAL } from './src/config/reveal.js';
import { NAV_HEIGHT_PX } from './src/config/layout.js';

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
        forest: '#0F3D2A',
        'sage-soft': '#EAF3EE',
        warning: '#8A5300',
      },
      spacing: {
        nav: `${NAV_HEIGHT_PX / 16}rem`,
        gutter: '1rem',
        'gutter-md': '1.5rem',
        'gutter-lg': '2rem',
        'stack-xs': '0.25rem',
        'stack-sm': '0.5rem',
        'stack-md': '0.75rem',
        stack: '1rem',
        'stack-lg': '1.5rem',
        'stack-xl': '2rem',
        section: '3rem',
        'section-lg': '4rem',
      },
      transitionDuration: {
        reveal: `${REVEAL.durationMs}ms`,
      },
      transitionTimingFunction: {
        reveal: REVEAL.easing,
      },
      // Fundido de entrada de las páginas privadas (A12): sin fill-mode, el estado final es el natural.
      keyframes: {
        'page-fade': { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        'page-fade': `page-fade ${REVEAL.durationMs}ms ${REVEAL.easing}`,
      },
      fontFamily: {
        primary: ['Amaranth', 'sans-serif'],
        secondary: ['Sen', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
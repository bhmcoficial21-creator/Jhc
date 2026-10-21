/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#0a0a0a', panel: '#141414', panel2: '#1c1c1c', line: '#2a2a2a', lime: { DEFAULT: '#c6ff00', dark: '#a3d100' }, danger: '#ff4d4d', warn: '#ffb020' },
      fontFamily: { display: ['"Barlow Condensed"', '"Arial Narrow"', 'Impact', 'sans-serif'], sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
}

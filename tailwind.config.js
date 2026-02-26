/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FFF5F7',
          100: '#FFE5EC',
          200: '#FFB3C6',
          300: '#FF6B9D',
          400: '#FF6B9D',
          500: '#FF6B9D',
          600: '#E63E6D',
          700: '#C41E5C',
          900: '#2D0A1A',
        },
        accent: {
          50:  '#F0FFF4',
          100: '#D4F4DD',
          200: '#9AE6B4',
          300: '#48BB78',
          400: '#48BB78',
          500: '#48BB78',
          600: '#2F855A',
          700: '#1C6E42',
        },
      },
      fontFamily: {
        heading: ['Syne', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf3f2',
          100: '#fce7e5',
          200: '#f9d1ce',
          300: '#f4ada8',
          400: '#ec7e77',
          500: '#e05248',
          600: '#cc3b32',
          700: '#c0392b',
          800: '#9a2b20',
          900: '#7f261d',
          950: '#450f0a'
        }
      }
    }
  },
  plugins: []
}

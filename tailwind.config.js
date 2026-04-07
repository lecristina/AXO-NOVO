/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#8f00cc',
          light: '#b44ddb',
          dark: '#6b00a3',
          50: '#f5e6ff',
          100: '#e6c2ff',
          200: '#cc80ff',
          300: '#b34dff',
          400: '#9f1aff',
          500: '#8f00cc',
          600: '#7300a6',
          700: '#580080',
          800: '#3d005a',
          900: '#220033',
        },
      },
    },
  },
  plugins: [],
}

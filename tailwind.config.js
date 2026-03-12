/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Lora', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        ui: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#faf9f7',
          100: '#f2efe8',
          200: '#e4ddd0',
          300: '#cfc4b0',
          400: '#b5a48a',
          500: '#9e8c70',
          600: '#8a7660',
          700: '#72614f',
          800: '#5e5044',
          900: '#4e433a',
          950: '#2a231d',
        },
        gold: {
          400: '#d4a853',
          500: '#c49a3c',
          600: '#a8832a',
        },
        cream: '#fdfaf5',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          }
        }
      }
    },
  },
  plugins: [],
}

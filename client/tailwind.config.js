/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#060a14',
          900: '#0b1329',
          850: '#0f1a38',
          800: '#142247',
          700: '#1e3268',
          teal: '#0d9488',
          tealLight: '#14b8a6',
          accent: '#38bdf8',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
          sage: '#84a98c',
          sageLight: '#a3b18a'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Courier New', 'Consolas', 'monospace']
      }
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};

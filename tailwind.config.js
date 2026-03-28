/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary palette — navy / slate / off-white
        navy: {
          950: '#0a0f1e',
          900: '#0f172a',
          800: '#1e293b',
          700: '#2d3f55',
          600: '#3b5068',
          500: '#4a6380',
        },
        accent: {
          DEFAULT: '#3b82f6',  // muted blue
          hover:   '#2563eb',
          subtle:  '#eff6ff',
        },
      },
      animation: {
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'fade-up':   'fadeUp 0.4s ease-out both',
      },
      keyframes: {
        bounceIn: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeUp: {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

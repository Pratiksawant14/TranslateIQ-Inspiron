/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0F1B2D',
          secondary: '#1E3A5F',
          accent: '#3B82F6',
          'accent-light': '#60A5FA',
        },
        surface: '#0A1628',
        card: '#162032',
        border: '#1E3A5F',
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#475569',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#6366F1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

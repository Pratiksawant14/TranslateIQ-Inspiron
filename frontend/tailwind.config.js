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
        // Clean Modern Palette
        primary: '#2563EB',           // Blue
        'primary-hover': '#1D4ED8',   // Blue Dark
        background: '#F9FAFB',        // Very light gray
        surface: '#FFFFFF',           // White
        border: '#E5E7EB',            // Light gray
        success: '#10B981',           // Green
        error: '#EF4444',             // Red
        warning: '#F59E0B',           // Amber
        info: '#3B82F6',              // Blue
        text: {
          primary: '#111827',         // Dark gray
          secondary: '#6B7280',       // Medium gray
          muted: '#9CA3AF',           // Light gray
        },
        brand: {
          primary: '#2563EB',
          secondary: '#10B981',
          accent: '#3B82F6',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

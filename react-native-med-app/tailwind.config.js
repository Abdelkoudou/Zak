/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Light Sea Green Brand Colors
        primary: {
          50: '#f0fdfa',    // Very light tint
          100: '#ccfbf1',   // Light tint
          200: '#99f6e4',   // Lighter
          300: '#5eead4',   // Light
          400: '#2dd4bf',   // Medium light
          500: '#14b8a6',   // Base
          600: '#0d9488',   // Medium dark
          700: '#0f766e',   // Dark
          800: '#115e59',   // Darker
          900: '#134e4a',   // Darkest
        },
        // Semantic colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
    },
  },
  plugins: [],
}

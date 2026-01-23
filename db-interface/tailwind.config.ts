import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#09b2ac',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#09b2ac',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        secondary: {
          DEFAULT: '#9941ff',
          50: '#f5f0ff',
          100: '#ebe1ff',
          200: '#d7c2ff',
          300: '#ba94ff',
          400: '#9941ff',
          500: '#7d1cff',
          600: '#6a00f4',
          700: '#5900cc',
          800: '#4a00a8',
          900: '#3d008a',
        },
        neutral: {
          light: '#f8f2e8', // Floral White
          dark: '#262626',  // Eerie Black
        },
        brand: {
          teal: '#09b2ac',
          purple: '#9941ff',
          white: '#f8f2e8',
          black: '#262626',
        },
        success: '#10B981',
        destructive: '#EF4444',
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Inter", "sans-serif"],
        body: ["var(--font-body)", "Cairo", "sans-serif"],
        arabic: ["var(--font-arabic)", "Cairo", "sans-serif"],
      },
      borderRadius: {
        'brand': '0.5rem',
        'brand-sm': '0.25rem',
        'brand-lg': '1rem',
      },
      spacing: {
        'brand-base': '4px',
      }
    },
  },
  plugins: [],
};
export default config;

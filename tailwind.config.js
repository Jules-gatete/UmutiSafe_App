/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#0B6FA7',
          green: '#2E8B57',
        },
        accent: {
          cta: '#19A3FF',
        },
        warning: '#E03E2D',
        background: {
          light: '#F6F7F9',
          dark: '#0F1720',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1A2332',
        },
        text: {
          dark: '#0B1720',
          light: '#F1F5F9',
        },
      },
    },
  },
  plugins: [],
};

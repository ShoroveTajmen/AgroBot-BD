/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          dark: '#1a4d1a',
          mid: '#2d6a2d',
          light: '#e8f5e9',
          border: '#c8e6c9',
        }
      }
    },
  },
  plugins: [],
}

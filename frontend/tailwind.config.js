/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sail: {
          bg: "#101B24",
          surface: "#16232D",
          card: "#24313C",
          border: "#435568",
          primary: "#F0F4F8",
          secondary: "#B8C4D0",
          accent: "#A9C9EE",
          accentHover: "#8cb7e8",
          success: "#34D399",
          warning: "#FBBF24",
          danger: "#F87171"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

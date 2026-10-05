/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amazonOrange: "#FF9900",
        coachCyan: "#00F0FF",
        darkMirror: "#0A0D14",
        hudCard: "#131826",
      },
      fontFamily: {
        tv: ['"Inter"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

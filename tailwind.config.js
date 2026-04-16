/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0D2247",
        "navy-light": "#1F3A6E",
        gold: "#C9950C",
      },
      fontFamily: {
        korean: ["Malgun Gothic", "맑은 고딕", "sans-serif"],
      },
    },
  },
  plugins: [],
};

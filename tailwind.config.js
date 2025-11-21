/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        mist: {
          50: "#fdfbf5",
          100: "#f7f2e5",
          200: "#efe4ca",
        },
        sky: {
          50: "#f2f8ff",
          100: "#dcebf8",
          200: "#bcd5f0",
          500: "#6b9ecf",
          600: "#517ea8",
        },
        sun: {
          50: "#fff8ed",
          100: "#ffe9c2",
          300: "#facc88",
        },
        slate: {
          700: "#2f3a4a",
          800: "#1f2933",
        },
      },
      boxShadow: {
        soft: "0 12px 40px rgba(80, 115, 168, 0.12)",
      },
      fontFamily: {
        display: ["\"Nunito Sans\"", "system-ui", "sans-serif"],
        body: ["\"Inter\"", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};


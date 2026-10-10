/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")], // <--- Phải có dòng này App mới nhận CSS
  theme: {
    extend: {},
  },
  plugins: [],
}
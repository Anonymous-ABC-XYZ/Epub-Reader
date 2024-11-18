/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
    fontFamily: {
      serif: ["Bricolage Grotesque 96pt Condensed"],
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};

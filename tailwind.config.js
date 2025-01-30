import { platformSelect } from "nativewind/theme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: platformSelect({
          ios: "GeneralSans",
          android: "sans-serif",
          default: "ui-sans-serif",
        }),
        "sans-semibold": platformSelect({
          ios: "GeneralSans-Semibold",
          android: "sans-serif",
          default: "ui-sans-serif",
        }),

      },
    }
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#101417", deep: "#0D0D0D", raised: "#161B1F" },
        panel: { DEFAULT: "#1a1a1a", light: "#1f1f1f" },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E8C96A",
          dark: "#B8860B",
          bright: "#FFD700",
        },
        line: "#2a2a2a",
      },
      fontFamily: {
        display: ["Montserrat", "ui-sans-serif", "system-ui"],
        sans: ["Manrope", "ui-sans-serif", "system-ui"],
      },
      backgroundImage: {
        "panel-gradient": "linear-gradient(160deg, #1f1f1f 0%, #1a1a1a 100%)",
        "gold-gradient": "linear-gradient(135deg, #B8860B 0%, #D4AF37 45%, #E8C96A 100%)",
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(212,175,55,0.25), 0 12px 30px -18px rgba(212,175,55,0.55)",
        panel: "0 18px 40px -28px rgba(0,0,0,0.9)",
      },
    },
  },
  plugins: [],
};

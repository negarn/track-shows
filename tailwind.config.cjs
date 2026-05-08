/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#04101d",
          900: "#07111f",
          800: "#0d1a2d",
          700: "#16253c",
        },
        sand: {
          50: "#f8f4eb",
          100: "#f1e8d7",
        },
        ember: {
          50: "#fff4ec",
          100: "#ffe0ca",
          200: "#ffbf93",
          300: "#ff9d5a",
          400: "#ff7a28",
        },
        ocean: {
          100: "#dff8f7",
          200: "#b7f2ee",
          300: "#7be7e2",
        },
      },
      boxShadow: {
        glow: "0 20px 60px rgba(0, 0, 0, 0.35)",
        soft: "0 0 0 1px rgba(255,255,255,0.06), 0 18px 60px rgba(0,0,0,0.28)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -10px, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        float: "float 10s ease-in-out infinite",
        shimmer: "shimmer 10s linear infinite",
      },
    },
  },
  plugins: [],
};

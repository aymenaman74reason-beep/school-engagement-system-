/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6", // Brand Color (Blue)
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        sidebar: {
          DEFAULT: "#111827",
          active: "#1f2937",
          hover: "#374151",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Minimal shadows as requested
        card: "0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)",
        input: "0 0 0 1px rgba(0,0,0,0.1)",
        "input-focus": "0 0 0 2px rgba(255, 75, 51, 0.2), 0 0 0 1px #ff4b33",
      },
    },
  },
  plugins: [],
};

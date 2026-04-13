export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          base:     "#07090f",
          surface:  "#0d1117",
          elevated: "#161b27",
          overlay:  "#1c2333",
        },
        brand: {
          DEFAULT: "#3b82f6",
          light:   "#60a5fa",
          dark:    "#2563eb",
          glow:    "rgba(59,130,246,0.35)",
        },
        status: {
          live:    "#10b981",
          offline: "#6b7280",
          record:  "#ef4444",
          alert:   "#f59e0b",
          ai:      "#8b5cf6",
        },
        border: {
          DEFAULT: "#1e2840",
          strong:  "#2d3a56",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      width: {
        sidebar: "240px",
        "sidebar-collapsed": "64px",
      },
      animation: {
        "pulse-live": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.25s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

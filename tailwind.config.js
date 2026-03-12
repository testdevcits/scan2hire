/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#f84525", // bright/red as main
        secondary: "#ffa826", // warm orange
        accent: "#10B981", // green accent
        danger: "#EF4444",
        light: "#F3F4F6",
        dark: "#111827",
        header: "#f84525",
        tabActive: "#ffa826",
        scrollbarTrack: "#E5E7EB",
        scrollbarThumb: "#f84525",
        systemText: "#333333",

        // System-like / neutral tones
        system: {
          primary: "#f84525",
          background: "#FEFEFE",
          surface: "#F9FAFB",
          muted: "#F3F4F6",
        },

        // Toast notifications
        toast: {
          info: "#f84525",
          success: "#10B981",
          warning: "#ffa826",
          error: "#EF4444",
        },

        // Gradient-friendly colors for UI
        success: {
          DEFAULT: "#10B981",
          50: "#E6F9F1",
          100: "#C2F0D9",
          200: "#99E7C0",
          300: "#70DDA6",
          400: "#4CD590",
          500: "#26CC77",
          600: "#10B981",
          700: "#0E9A66",
          800: "#0B7B53",
          900: "#075B3A",
        },
        yellow: {
          DEFAULT: "#ffa826",
          50: "#FFF7E6",
          100: "#FFE9BF",
          200: "#FFD999",
          300: "#FFC966",
          400: "#FFB933",
          500: "#ffa826",
          600: "#D48809",
          700: "#B27307",
          800: "#8F5C05",
          900: "#6B4603",
        },
        red: {
          DEFAULT: "#f84525",
          50: "#FFECE9",
          100: "#FFD6D0",
          200: "#FFB3A6",
          300: "#FF8F7C",
          400: "#FF6B52",
          500: "#f84525",
          600: "#E33C1F",
          700: "#C6321A",
          800: "#A12815",
          900: "#801D11",
        },
        coolGray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },

      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
      },

      fontSize: {
        paragraph: ["18px", "28px"],
      },

      fontWeight: {
        medium: 500,
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        custom: "12px",
        full: "9999px",
      },

      screens: {
        xs: "320px",
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },

      spacing: {
        128: "32rem",
        144: "36rem",
        160: "40rem",
      },

      keyframes: {
        "slide-fade-in": {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-fade-out": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-20px)", opacity: "0" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-100%)", opacity: "0" },
        },
      },

      animation: {
        "slide-fade-in": "slide-fade-in 0.3s ease-out forwards",
        "slide-fade-out": "slide-fade-out 0.3s ease-in forwards",
        "slide-down": "slide-down 0.3s ease-out forwards",
        "slide-up": "slide-up 0.3s ease-in forwards",
      },
    },
  },

  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".hide-scrollbar": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
        ".hide-scrollbar::-webkit-scrollbar": {
          display: "none",
        },
      });
    },
  ],
};

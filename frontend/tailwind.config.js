/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#090d16",
          card: "#0f172a",
          cardBorder: "#1e293b",
          primary: "#38bdf8",
          accent: "#818cf8",
          danger: "#f43f5e",
          warning: "#fbbf24",
          success: "#10b981",
          purple: "#a855f7"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(56, 189, 248, 0.7)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef9ff',
          100: '#d8f1ff',
          200: '#b9e8ff',
          300: '#88daff',
          400: '#50c2fd',
          500: '#27a5f9',
          600: '#0f87ee',
          700: '#0870db',
          800: '#0c5ab1',
          900: '#104d8b',
          950: '#0c3060',
        },
        accent: {
          400: '#f59e0b',
          500: '#f97316',
          600: '#ea580c',
        },
        surface: {
          900: '#0a0f1e',
          800: '#0f1629',
          700: '#151d35',
          600: '#1a2444',
          500: '#1f2b53',
          400: '#253362',
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23253362' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(39,165,249,0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(39,165,249,0.8), 0 0 40px rgba(39,165,249,0.3)' },
        },
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(39,165,249,0.4)',
        'glow-accent': '0 0 20px rgba(249,115,22,0.4)',
        'inner-brand': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
    },
  },
  plugins: [],
}

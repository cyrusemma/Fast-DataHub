/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0066FF', 50: '#EBF2FF', 100: '#D6E5FF', 600: '#0052CC', 700: '#003D99' },
        success: { DEFAULT: '#00C48C', light: '#E6FAF5' },
        warning: { DEFAULT: '#FFB300', light: '#FFF8E6' },
        danger: { DEFAULT: '#FF4444', light: '#FFE8E8' },
        surface: '#F8FAFF',
        dark: '#0A0F1E',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(10, 15, 30, 0.06), 0 1px 2px rgba(10, 15, 30, 0.04)',
        'card-hover': '0 10px 30px -10px rgba(0, 102, 255, 0.18)',
        glow: '0 0 0 4px rgba(0, 102, 255, 0.12)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

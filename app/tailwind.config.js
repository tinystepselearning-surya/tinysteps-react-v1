/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Touch-specific breakpoints
      'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
      'mouse': { 'raw': '(hover: hover) and (pointer: fine)' },
    },
    extend: {
      spacing: {
        'touch': '44px',
        'touch-lg': '48px',
        'touch-xl': '56px',
      },
      animation: {
        shake: 'shake 0.5s ease-in-out',
        'touch-feedback': 'touch-feedback 0.2s ease',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
        'touch-feedback': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      fontSize: {
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.4vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.5vw, 1.5rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.6vw, 1.875rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.2rem + 1vw, 2.5rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.5rem + 1.5vw, 3rem)',
      },
    },
  },
  plugins: [],
};

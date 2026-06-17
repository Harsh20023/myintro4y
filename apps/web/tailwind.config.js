/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        mono: ['var(--font-dm-mono)', 'DM Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        ink: {
          50:  '#f8f7f4',
          100: '#efeee9',
          200: '#dddbd2',
          300: '#c5c2b6',
          400: '#aaa695',
          500: '#928d7c',
          600: '#7a7568',
          700: '#635f55',
          800: '#524e47',
          900: '#46433d',
          950: '#252320',
        },
      },
      animation: {
        'fade-up':      'fadeUp 0.5s ease-out forwards',
        'fade-in':      'fadeIn 0.4s ease-out forwards',
        'slide-in':     'slideIn 0.4s ease-out forwards',
        'float':        'float 6s ease-in-out infinite',
        'float-slow':   'float 9s ease-in-out infinite',
        'float-slower': 'float 12s ease-in-out infinite',
        'shimmer':      'shimmer 2.4s linear infinite',
        'sweep':        'sweep 1.8s ease-in-out infinite',
        'spin-slow':    'spin 22s linear infinite',
        'pulse-glow':   'pulseGlow 3s ease-in-out infinite',
        'slide-up':     'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'scale-in':     'scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%':     { opacity: '0.9', transform: 'scale(1.1)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        sweep: {
          '0%':   { transform: 'translateX(-100%)' },
          '60%':  { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}

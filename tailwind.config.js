/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'typing': 'typing 1.5s steps(30) infinite',
        'blink': 'blink 1s infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        typing: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      colors: {
        // Premium Orange Theme
        primary: {
          DEFAULT: '#FF6B35',
          50: '#FFF5F0',
          100: '#FFE5D9',
          200: '#FFD0B8',
          300: '#FFB596',
          400: '#FF8E5E',
          500: '#FF6B35',
          600: '#E55A2B',
          700: '#C44A20',
          800: '#A33A1A',
          900: '#822A15',
          950: '#5A1A0F',
        },
        'primary-foreground': '#FFFFFF',
        
        // Dark mode colors
        'dark-background': '#0A0A0A',
        'dark-foreground': '#FFFFFF',
        'dark-card': '#1A1A1A',
        'dark-muted-foreground': '#666666',
        'dark-border': '#2A2A2A',
        
        // Light mode colors
        background: '#FFFFFF',
        foreground: '#1A1A1A',
        card: '#F5F5F5',
        'muted-foreground': '#666666',
        border: '#E8E8E8',
        muted: '#E8E8E8',
        accent: '#FF6B35',
        'accent-foreground': '#FFFFFF',
        // Custom semantic colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
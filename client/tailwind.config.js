export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#ffffff',
          card: '#f8fafc',
          border: '#e2e8f0',
          highlight: '#f1f5f9',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          DEFAULT: '#2563eb',
        },
        accent: {
          success: '#16a34a',
          warning: '#ea580c',
          danger: '#dc2626',
        },
        text: {
          primary: '#0f172a',
          muted: '#64748b',
          dim: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        slideDown: 'slideDown 0.4s ease-out',
      },
    },
  },
  plugins: [],
}

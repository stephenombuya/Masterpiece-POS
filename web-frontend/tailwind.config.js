/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e3f2fd',
          100: '#bbdefb',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1565c0',
          800: '#0d47a1',
          900: '#0a2d6e',
        },
        success: { 50: '#e8f5e9', 600: '#2e7d32', 700: '#1b5e20' },
        danger:  { 50: '#ffebee', 600: '#c62828', 700: '#b71c1c' },
        warning: { 50: '#fff8e1', 600: '#f57c00', 700: '#e65100' },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        piano: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d0ff',
          500: '#4f6ef7',
          600: '#3b55e6',
          700: '#2d42cc',
          800: '#1e2d99',
          900: '#12216b',
        }
      }
    }
  },
  plugins: []
}

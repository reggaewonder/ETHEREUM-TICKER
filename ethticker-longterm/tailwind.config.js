/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme palette matching bitcointicker aesthetic
        'ticker-bg': '#0d0d0f',
        'ticker-card': '#131318',
        'ticker-border': '#1e1e24',
        'ticker-green': '#00c853',
        'ticker-red': '#ff1744',
        'ticker-text': '#e0e0e0',
        'ticker-muted': '#6b6b6b',
      },
      fontFamily: {
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

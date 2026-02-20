/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f1117',
          800: '#161b22',
          700: '#21262d',
          600: '#30363d',
        },
        neon: {
          blue: '#00d9ff',
          purple: '#bb86fc',
          pink: '#ff006e',
          green: '#00ff41',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

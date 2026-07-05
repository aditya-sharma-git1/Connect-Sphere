/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0E1526',   // page background — deep blue-black, not flat black
          raised: '#16203A',    // card/surface background
          higher: '#1E2A4A',    // hover/elevated surface
        },
        signal: {
          DEFAULT: '#F4A340',   // warm amber — primary accent, calls-to-action
          dim: '#C9832F',
        },
        live: {
          DEFAULT: '#35D9B4',   // teal-mint — "connected"/active/online states
          dim: '#249A80',
        },
        danger: '#E5484D',
        ink_text: {
          DEFAULT: '#EDF1F7',
          muted: '#8C99B3',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {
        ringPulse: {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '80%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        ringPulse: 'ringPulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}


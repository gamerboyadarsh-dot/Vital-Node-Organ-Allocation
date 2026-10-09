/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: 'var(--surface-0, #f5f5f5)',
          1: 'var(--surface-1, #ffffff)',
          2: 'var(--surface-2, #fafafa)',
          3: 'var(--surface-3, #f0f0f0)',
        },
        line: {
          DEFAULT: 'var(--line, #e5e5e5)',
          bright: 'var(--line-bright, #d4d4d4)',
          glow: 'var(--line-glow, rgba(10, 10, 10, 0.08))',
        },
        ink: {
          primary: 'var(--ink-primary, #0a0a0a)',
          secondary: 'var(--ink-secondary, #737373)',
          muted: 'var(--ink-muted, #a3a3a3)',
        },
        brand: {
          cyan: '#38BDF8',
          blue: '#3B82F6',
          indigo: '#6366F1',
          violet: '#8B5CF6',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          ember: '#e7000b',
        },
        signal: {
          critical: 'var(--signal-critical, #e7000b)',
          caution: 'var(--signal-caution, #d97706)',
          stable: 'var(--signal-stable, #059669)',
          info: 'var(--signal-info, #0071e3)',
          blue: '#0071e3',
        },
        augen: {
          black: '#0f1012',
          pure: '#020201',
          canvas: '#f2f2f4',
          panel: '#fdfdfd',
          steel: '#5e5e5e',
          ash: '#8f8f8f',
          blue: '#0071e3',
        },
      },
      borderRadius: {
        'pill': '26px',
        'card-lg': '54px',
        'card-md': '32px',
      },
      letterSpacing: {
        'augen': '-0.02em',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'gradient-x': 'gradientX 4s ease infinite',
        'shimmer-fast': 'shimmerFast 1.5s infinite linear',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmerFast: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(56, 189, 248, 0.35)',
        'glow-violet': '0 0 20px -5px rgba(139, 92, 246, 0.35)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.35)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.35)',
        'card-hover': '0 12px 30px -10px rgba(0, 0, 0, 0.7), 0 0 20px -5px rgba(56, 189, 248, 0.12)',
      },
    },
  },
  plugins: [],
}

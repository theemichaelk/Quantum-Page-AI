/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // or 'media' for system preference
  theme: {
    extend: {
      colors: {
        // Core palette from UI design concept
        carbon: '#0F1115',      // Body background
        onyx: '#171B22',        // Panel surface
        'neon-azure': '#28C8FF', // Primary action, line charts
        'quantum-violet': '#7B6CFF', // Secondary accent, progress rings
        'lime-pulse': '#C6FF4F', // Success, up-trends
        'signal-amber': '#FFB547', // Warning, neutral change
        'critical-red': '#FF5470', // Errors, down-trends
        'ice-white': '#E9F1FF',  // Text on dark surfaces
        
        // Semantic mappings
        primary: '#28C8FF',
        secondary: '#7B6CFF',
        success: '#C6FF4F',
        warning: '#FFB547',
        error: '#FF5470',
        
        // Background levels
        'bg-base': '#0F1115',
        'bg-surface': '#171B22',
        'bg-elevated': '#1D2029',
        
        // Text levels
        'text-primary': '#E9F1FF',
        'text-secondary': '#A0A8B8',
        'text-muted': '#3D4354',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sora: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
        '128': '32rem',
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(40, 200, 255, 0.5)',
        'glow-secondary': '0 0 15px rgba(123, 108, 255, 0.5)',
        'glow-success': '0 0 15px rgba(198, 255, 79, 0.5)',
        'glow-error': '0 0 15px rgba(255, 84, 112, 0.5)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(40, 200, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(40, 200, 255, 0.6)' },
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.ice-white'),
            a: {
              color: theme('colors.neon-azure'),
              '&:hover': {
                color: theme('colors.quantum-violet'),
              },
            },
            h1: {
              color: theme('colors.ice-white'),
              fontFamily: theme('fontFamily.sora'),
            },
            h2: {
              color: theme('colors.ice-white'),
              fontFamily: theme('fontFamily.sora'),
            },
            h3: {
              color: theme('colors.ice-white'),
              fontFamily: theme('fontFamily.sora'),
            },
            h4: {
              color: theme('colors.ice-white'),
              fontFamily: theme('fontFamily.sora'),
            },
            code: {
              color: theme('colors.lime-pulse'),
              fontFamily: theme('fontFamily.mono'),
              backgroundColor: theme('colors.onyx'),
              padding: '0.25rem',
              borderRadius: '0.25rem',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
